import mongoose from "mongoose";
import ReturnDashData from "../../helper/ReturnDashData/index.js";
import {
  JobReportModel,
  jobsModel,
} from "../../models/index.js";
import { rebuildJobIntegration } from "../../services/search/rebuildSearchData.js";
import { recomputeAndSaveJobTrust } from "../../services/trust/jobTrust.service.js";
import { writeAuditLog } from "../../services/auditLog.service.js";
import { recordAnalyticsEvent } from "../../services/analytics/analyticsEvent.service.js";

const toObjectId = (value) => {
  const id = String(value || "").trim();
  return mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null;
};

const clean = (value = "") => String(value || "").trim();
const adminId = (req) => req.admin?._id || req.user?._id || null;
const recordTrustAdminAnalytics = ({ req, event, job, jobId, note = "", metadata = {} }) =>
  recordAnalyticsEvent({
    req,
    event,
    userId: adminId(req),
    companyId: job?.company_id,
    activeContext: req.activeContext,
    entityType: "job",
    entityId: jobId || job?._id,
    jobId: jobId || job?._id,
    metadata: {
      source: "trust_admin_review",
      note: clean(note),
      review_status: clean(job?.trust?.review_status),
      risk_level: clean(job?.trust?.risk_level),
      ...metadata,
    },
  }).catch(() => null);
const toInt = (value, fallback = 1, min = 1, max = 200) => {
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(n, min), max);
};

const riskFilter = (value = "open") => {
  const status = clean(value).toLowerCase();
  if (status === "all") return {};
  if (status === "safe") return { "trust.review_status": "safe" };
  if (status === "suspended") return { "trust.review_status": "suspended" };
  if (status === "critical") return { "trust.risk_level": "critical" };
  if (status === "high") return { "trust.risk_level": { $in: ["high", "critical"] } };
  return {
    $or: [
      { "trust.risk_level": { $in: ["high", "critical"] } },
      { "trust.report_count": { $gt: 0 } },
      { publish_status: "pending_review" },
    ],
    "trust.review_status": { $ne: "safe" },
  };
};

export const reviewQueue = async (req, res) => {
  try {
    const page = toInt(req.query.page, 1, 1, 100000);
    const limit = toInt(req.query.limit, 20, 1, 100);
    const skip = (page - 1) * limit;
    const filter = riskFilter(req.query.status || req.query.risk || "open");

    const q = clean(req.query.search || req.query.q);
    if (q) {
      const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { job_name: regex },
          { description: regex },
          { ref: regex },
          { "search_projection.company.name": regex },
        ],
      });
    }

    const [jobs, total] = await Promise.all([
      jobsModel
        .find(filter)
        .populate({ path: "company_id", select: "company_name company_email status accepted is_verified rating_avg rating_count trust" })
        .sort({ "trust.risk_level": -1, "trust.report_count": -1, updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      jobsModel.countDocuments(filter),
    ]);

    const reportCounts = await JobReportModel.aggregate([
      { $match: { job_id: { $in: jobs.map((job) => job._id) } } },
      {
        $group: {
          _id: "$job_id",
          total: { $sum: 1 },
          pending: { $sum: { $cond: [{ $in: ["$status", ["pending", "reviewing"]] }, 1, 0] } },
          latest_reason: { $last: "$reason" },
          latest_message: { $last: "$message" },
        },
      },
    ]);
    const reportsByJob = new Map(reportCounts.map((item) => [String(item._id), item]));

    return ReturnDashData.getData({
      res,
      data: jobs.map((job) => ({
        ...job,
        report_summary: reportsByJob.get(String(job._id)) || {
          total: job.trust?.report_count || 0,
          pending: 0,
          latest_reason: "",
          latest_message: "",
        },
      })),
      other: {
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          has_next: page * limit < total,
          has_prev: page > 1,
        },
      },
      message: "trust_review_queue",
    });
  } catch (error) {
    return ReturnDashData.getError({ res, status: 500, message: error.message || "trust_review_queue_failed" });
  }
};

const updateReportsForJob = (jobId, patch) =>
  JobReportModel.updateMany(
    { job_id: jobId, status: { $in: ["pending", "reviewing"] } },
    { $set: patch }
  );

export const markJobSafe = async (req, res) => {
  try {
    const jobId = toObjectId(req.params.jobId || req.params.id);
    if (!jobId) return ReturnDashData.updateError({ res, status: 400, message: "invalid_job_id" });

    const note = clean(req.body.note || req.body.admin_note || "marked_safe");
    await updateReportsForJob(jobId, {
      status: "resolved",
      reviewed_by: adminId(req),
      reviewed_at: new Date(),
    });

    const score = await recomputeAndSaveJobTrust(jobId);
    const job = await jobsModel.findByIdAndUpdate(
      jobId,
      {
        $set: {
          "trust.review_status": "safe",
          "trust.score": Math.max(score?.score || 0, 85),
          "trust.risk_level": "low",
          "trust.admin_note": note,
          "trust.document_request.status": "requested",
          "trust.document_request.note": note,
          "trust.document_request.requested_by": adminId(req),
          "trust.document_request.requested_at": new Date(),
          "trust.document_response.status": "requested",
          "trust.document_response.reviewed_by": null,
          "trust.document_response.reviewed_at": null,
          "trust.reviewed_by": adminId(req),
          "trust.reviewed_at": new Date(),
        },
      },
      { new: true, runValidators: true }
    ).populate("company_id");

    if (!job) return ReturnDashData.updateError({ res, status: 404, message: "job_not_found" });
    await rebuildJobIntegration(jobId, { rebuildMatches: true });
    await writeAuditLog({ req, companyId: job.company_id, actorUserId: adminId(req), actorType: "admin", action: "trust_job_marked_safe", entityType: "job", entityId: jobId, jobId, note });
    await recordTrustAdminAnalytics({
      req,
      event: "job_trust_marked_safe",
      job,
      jobId,
      note,
      metadata: { action: "mark_safe", score: job.trust?.score || Math.max(score?.score || 0, 85) },
    });
    return ReturnDashData.updateData({ res, data: job, message: "job_marked_safe" });
  } catch (error) {
    return ReturnDashData.updateError({ res, status: 500, message: error.message || "trust_mark_safe_failed" });
  }
};

export const suspendJob = async (req, res) => {
  try {
    const jobId = toObjectId(req.params.jobId || req.params.id);
    if (!jobId) return ReturnDashData.updateError({ res, status: 400, message: "invalid_job_id" });

    const reason = clean(req.body.reason || req.body.message || "suspended_by_trust_review");
    await updateReportsForJob(jobId, {
      status: "resolved",
      reviewed_by: adminId(req),
      reviewed_at: new Date(),
    });

    const job = await jobsModel.findByIdAndUpdate(
      jobId,
      {
        $set: {
          status: false,
          is_accepted: false,
          publish_status: "closed",
          rejection_reason: reason,
          "trust.review_status": "suspended",
          "trust.score": 0,
          "trust.risk_level": "critical",
          "trust.admin_note": reason,
          "trust.reviewed_by": adminId(req),
          "trust.reviewed_at": new Date(),
          "trust.last_scored_at": new Date(),
        },
      },
      { new: true, runValidators: true }
    ).populate("company_id");

    if (!job) return ReturnDashData.updateError({ res, status: 404, message: "job_not_found" });
    await rebuildJobIntegration(jobId, { rebuildMatches: false });
    await writeAuditLog({ req, companyId: job.company_id, actorUserId: adminId(req), actorType: "admin", action: "trust_job_suspended", entityType: "job", entityId: jobId, jobId, note: reason });
    await recordTrustAdminAnalytics({
      req,
      event: "job_trust_suspended",
      job,
      jobId,
      note: reason,
      metadata: { action: "suspend", score: job.trust?.score || 0 },
    });
    return ReturnDashData.updateData({ res, data: job, message: "job_suspended" });
  } catch (error) {
    return ReturnDashData.updateError({ res, status: 500, message: error.message || "trust_suspend_failed" });
  }
};

export const requestDocuments = async (req, res) => {
  try {
    const jobId = toObjectId(req.params.jobId || req.params.id);
    if (!jobId) return ReturnDashData.updateError({ res, status: 400, message: "invalid_job_id" });

    const note = clean(req.body.note || req.body.message || "documents_requested");
    await updateReportsForJob(jobId, {
      status: "reviewing",
      reviewed_by: adminId(req),
      reviewed_at: new Date(),
    });

    const score = await recomputeAndSaveJobTrust(jobId);
    const job = await jobsModel.findByIdAndUpdate(
      jobId,
      {
        $set: {
          "trust.review_status": "needs_documents",
          "trust.score": score?.score || 50,
          "trust.risk_level": score?.risk_level || "medium",
          "trust.admin_note": note,
          "trust.document_request.status": "requested",
          "trust.document_request.note": note,
          "trust.document_request.requested_by": adminId(req),
          "trust.document_request.requested_at": new Date(),
          "trust.document_response.status": "requested",
          "trust.document_response.reviewed_by": null,
          "trust.document_response.reviewed_at": null,
          "trust.reviewed_by": adminId(req),
          "trust.reviewed_at": new Date(),
        },
      },
      { new: true, runValidators: true }
    ).populate("company_id");

    if (!job) return ReturnDashData.updateError({ res, status: 404, message: "job_not_found" });
    await writeAuditLog({ req, companyId: job.company_id, actorUserId: adminId(req), actorType: "admin", action: "trust_job_documents_requested", entityType: "job", entityId: jobId, jobId, note });
    await recordTrustAdminAnalytics({
      req,
      event: "job_trust_documents_requested",
      job,
      jobId,
      note,
      metadata: { action: "request_documents", score: job.trust?.score || score?.score || 50 },
    });
    return ReturnDashData.updateData({ res, data: job, message: "job_documents_requested" });
  } catch (error) {
    return ReturnDashData.updateError({ res, status: 500, message: error.message || "trust_request_documents_failed" });
  }
};

export default {
  reviewQueue,
  markJobSafe,
  suspendJob,
  requestDocuments,
};
