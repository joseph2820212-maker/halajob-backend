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
import { recordAnalyticsEvent } from "../../services/analytics/analyticsEvent.service.js";

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

const companyContextTypes = new Set(["company_admin", "company_member"]);

const currentCompanyId = (req) => {
  const context = req.appAccount?.activeContext || req.activeContext || {};
  if (companyContextTypes.has(context.context_type)) {
    const contextCompanyId = toObjectId(context.entity_id);
    if (contextCompanyId) return contextCompanyId;
  }

  return toObjectId(req.appAccount?.company?._id || req.appAccount?.company?.id);
};

const valuesFrom = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.flatMap(valuesFrom);
  if (typeof value === "object") return [value];

  const text = clean(value);
  if (!text) return [];

  if (text.startsWith("[") || text.startsWith("{")) {
    try {
      return valuesFrom(JSON.parse(text));
    } catch {
      return [text];
    }
  }

  return text.split(/[\n,]+/).map(clean).filter(Boolean);
};

const responseLinksFromBody = (body = {}) =>
  valuesFrom(
    body.document_links ||
      body.evidence_links ||
      body.links ||
      body.document_urls ||
      body.urls ||
      body.documents ||
      body.document_url ||
      body.evidence_url ||
      body.url
  );

const normalizeEvidenceLinks = (body = {}) => {
  const rawLinks = responseLinksFromBody(body);
  const links = [];

  for (const item of rawLinks) {
    const object = item && typeof item === "object" && !Array.isArray(item) ? item : {};
    const url = clean(object.url || object.href || object.link || object.document_url || item);
    if (!url) continue;

    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      return { error: "invalid_document_link" };
    }

    if (parsed.protocol !== "https:") {
      return { error: "document_link_must_use_https" };
    }

    links.push({
      url,
      label: clean(object.label || object.title || object.name).slice(0, 120),
      kind: clean(object.kind || object.type || "evidence").slice(0, 50) || "evidence",
    });
  }

  if (links.length > 10) {
    return { error: "too_many_document_links" };
  }

  return { links };
};

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
    await recordAnalyticsEvent({
      req,
      event: "job_reported",
      entityType: "job",
      entityId: jobId,
      jobId,
      companyId: job.company_id,
      metadata: { reason, report_id: report._id },
    }).catch(() => null);

    return ReturnAppData.createData({
      res,
      data: { report, trust },
      message: message(req, "تم إرسال البلاغ بنجاح.", "Job report submitted successfully."),
    });
  } catch (error) {
    next(error);
  }
};

export const submitJobDocuments = async (req, res, next) => {
  try {
    const jobId = toObjectId(req.params.jobId || req.params.id);
    const companyId = currentCompanyId(req);
    const now = new Date();
    const note = clean(req.body.note || req.body.message || req.body.response || req.body.description).slice(0, 1500);
    const normalized = normalizeEvidenceLinks(req.body || {});

    if (!jobId) return ReturnAppData.updateError({ res, status: 400, message: "invalid_job_id" });
    if (!companyId) {
      return ReturnAppData.updateError({ res, status: 403, message: "company_context_required" });
    }
    if (normalized.error) {
      return ReturnAppData.updateError({
        res,
        status: 422,
        message: normalized.error,
      });
    }
    if (!note && normalized.links.length === 0) {
      return ReturnAppData.updateError({
        res,
        status: 422,
        message: "document_response_required",
      });
    }

    const job = await jobsModel.findOne({
      _id: jobId,
      company_id: companyId,
      deleted_at: null,
    });

    if (!job) {
      return ReturnAppData.updateError({
        res,
        status: 404,
        message: "job_not_found",
      });
    }

    if (job.trust?.review_status !== "needs_documents") {
      return ReturnAppData.updateError({
        res,
        status: 409,
        message: "trust_documents_not_requested",
      });
    }

    const updatedJob = await jobsModel.findOneAndUpdate(
      { _id: jobId, company_id: companyId, deleted_at: null },
      {
        $set: {
          "trust.document_request.status": "submitted",
          "trust.document_response.status": "submitted",
          "trust.document_response.note": note,
          "trust.document_response.links": normalized.links,
          "trust.document_response.submitted_by": req.user._id,
          "trust.document_response.submitted_at": now,
          "trust.document_response.reviewed_by": null,
          "trust.document_response.reviewed_at": null,
        },
      },
      { new: true, runValidators: true }
    ).populate("company_id");

    await writeAuditLog({
      req,
      companyId,
      actorUserId: req.user._id,
      actorType: "company_member",
      action: "trust_job_documents_submitted",
      entityType: "job",
      entityId: jobId,
      jobId,
      note,
      newValue: {
        link_count: normalized.links.length,
        document_response_status: "submitted",
      },
    });
    await recordAnalyticsEvent({
      req,
      event: "job_trust_documents_submitted",
      companyId,
      entityType: "job",
      entityId: jobId,
      jobId,
      metadata: {
        source: "company_trust_response",
        link_count: normalized.links.length,
      },
    }).catch(() => null);

    return ReturnAppData.updateData({
      res,
      data: updatedJob,
      message: "job_documents_submitted",
    });
  } catch (error) {
    next(error);
  }
};

export default {
  scoreJob,
  reportJob,
  submitJobDocuments,
};
