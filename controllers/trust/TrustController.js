import mongoose from "mongoose";
import ReturnAppData from "../../helper/ReturnAppData/index.js";
import {
  JobReportModel,
  jobsModel,
} from "../../models/index.js";
import {
  TRUST_REPORT_REASONS,
  recomputeAndSaveJobTrust,
} from "../../services/trust/jobTrust.service.js";
import { writeAuditLog } from "../../services/auditLog.service.js";

const toObjectId = (value) => {
  const id = String(value || "").trim();
  return mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null;
};

const lang = (req) => String(req.get("lan") || req.get("x-language") || "en").toLowerCase();
const message = (req, ar, en) => (lang(req).startsWith("ar") ? ar : en);
const clean = (value = "") => String(value || "").trim();

const publicJobFilter = () => ({
  status: true,
  is_accepted: true,
  publish_status: { $in: ["published", null] },
  deleted_at: null,
});

export const scoreJob = async (req, res, next) => {
  try {
    const jobId = toObjectId(req.params.jobId || req.params.id);
    if (!jobId) {
      return ReturnAppData.getError({ res, status: 400, message: "invalid_job_id" });
    }

    const job = await jobsModel.findOne({ _id: jobId, ...publicJobFilter() });
    if (!job) {
      return ReturnAppData.getError({
        res,
        status: 404,
        message: message(req, "الوظيفة غير موجودة.", "Job not found."),
      });
    }

    const trust = await recomputeAndSaveJobTrust(jobId);

    return ReturnAppData.getData({
      res,
      data: {
        job_id: String(jobId),
        trust,
        warnings: trust?.flags || [],
      },
      message: "job_trust_score",
    });
  } catch (error) {
    next(error);
  }
};

export const reportJob = async (req, res, next) => {
  try {
    const jobId = toObjectId(req.params.jobId || req.params.id);
    const reason = clean(req.body.reason || "other");
    const reportMessage = clean(req.body.message || req.body.note || "");

    if (!jobId) return ReturnAppData.getError({ res, status: 400, message: "invalid_job_id" });
    if (!TRUST_REPORT_REASONS.includes(reason)) {
      return ReturnAppData.getError({
        res,
        status: 422,
        message: "invalid_report_reason",
        other: { errors: { supported: TRUST_REPORT_REASONS } },
      });
    }
    if (reason === "other" && !reportMessage) {
      return ReturnAppData.getError({
        res,
        status: 422,
        message: message(req, "رسالة البلاغ مطلوبة.", "Report message is required."),
      });
    }

    const job = await jobsModel.findOne({ _id: jobId, ...publicJobFilter() });
    if (!job) {
      return ReturnAppData.getError({
        res,
        status: 404,
        message: message(req, "الوظيفة غير موجودة.", "Job not found."),
      });
    }

    const report = await JobReportModel.findOneAndUpdate(
      { user_id: req.user._id, job_id: jobId },
      {
        $set: {
          reason,
          message: reportMessage,
          company_id: job.company_id || null,
          status: "pending",
          reviewed_by: null,
          reviewed_at: null,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const trust = await recomputeAndSaveJobTrust(jobId);
    await writeAuditLog({
      req,
      companyId: job.company_id,
      actorUserId: req.user._id,
      actorType: "employee",
      action: "job_reported",
      entityType: "job",
      entityId: jobId,
      jobId,
      newValue: { reason, report_id: report._id, trust },
    });

    return ReturnAppData.createData({
      res,
      data: { report, trust },
      message: message(req, "تم إرسال البلاغ بنجاح.", "Job report submitted successfully."),
    });
  } catch (error) {
    next(error);
  }
};

export default {
  scoreJob,
  reportJob,
};
