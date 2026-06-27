import mongoose from "mongoose";
import ReturnAppData from "../../helper/ReturnAppData/index.js";
import { jobsModel } from "../../models/index.js";
import {
  getAuthUserId,
  getCompanyUserIdOrFail,
} from "../../helper/companyDash/companyDashHelpers.js";
import {
  getContentTranslation,
  normalizeTranslationLanguage,
  upsertContentTranslation,
} from "../../services/translations/contentTranslation.service.js";
import { writeAuditLog } from "../../services/auditLog.service.js";
import { recordAnalyticsEvent } from "../../services/analytics/analyticsEvent.service.js";

const clean = (value = "") => String(value || "").trim();
const isObject = (value) => value && typeof value === "object" && !Array.isArray(value);

const pickTranslatedFields = (body = {}) => {
  if (body.translated_text !== undefined) return body.translated_text;
  if (body.translation !== undefined) return body.translation;

  const fields = [
    "job_name",
    "description",
    "job_keywords",
    "skills_required",
    "skills_optional",
    "languages",
    "requirements",
    "summary",
  ];

  return fields.reduce((acc, field) => {
    if (body[field] !== undefined) acc[field] = body[field];
    return acc;
  }, {});
};

const mapSkill = (skill = {}) => ({
  title: clean(skill.title),
  level: skill.level ?? null,
  years: skill.years ?? null,
});

const mapLanguage = (language = {}) => ({
  name: clean(language.name),
  level: language.level ?? null,
  level_text: clean(language.level_text),
});

const buildJobOriginalText = (job = {}) => ({
  job_name: clean(job.job_name),
  description: clean(job.description),
  job_keywords: Array.isArray(job.job_keywords) ? job.job_keywords : [],
  skills_required: (job.skills_required || []).map(mapSkill),
  skills_optional: (job.skills_optional || []).map(mapSkill),
  languages: (job.languages || []).map(mapLanguage),
  candidate_target: Array.isArray(job.candidate_target) ? job.candidate_target : [],
});

const normalizeMetadata = (body = {}) => {
  if (isObject(body.metadata)) return body.metadata;
  return {};
};

const companyActorType = (req) =>
  req.companyAccess?.role === "owner" ? "company_owner" : "company_member";

const getJobTranslation = async (req, res, next) => {
  try {
    const jobId = clean(req.params.jobId || req.params.id);
    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return ReturnAppData.getError({ res, status: 400, message: "invalid_job_id" });
    }

    const targetLanguage = normalizeTranslationLanguage(req.params.lang);
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;

    const job = await jobsModel
      .findOne({
        _id: jobId,
        company_id: companyData.company._id,
        deleted_at: null,
      })
      .select("_id job_name company_id")
      .lean();

    if (!job) {
      return ReturnAppData.getError({ res, status: 404, message: "job_not_found" });
    }

    const result = await getContentTranslation({
      entityType: "job",
      entityId: job._id,
      targetLanguage,
    });

    if (!result.translation) {
      return ReturnAppData.getError({ res, status: 404, message: "translation_not_found" });
    }

    return ReturnAppData.getData({
      res,
      data: {
        translation: result.translation,
        published_translation: result.published_translation,
        can_publish: result.can_publish,
      },
      message: "job_translation",
    });
  } catch (error) {
    if (error.statusCode) {
      return ReturnAppData.getError({
        res,
        status: error.statusCode,
        message: error.code || error.message,
        other: { errors: { supported: error.supported } },
      });
    }

    return next(error);
  }
};

const saveJobTranslation = async (req, res, next) => {
  try {
    const jobId = clean(req.params.jobId || req.params.id);
    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return ReturnAppData.getError({ res, status: 400, message: "invalid_job_id" });
    }

    const targetLanguage = normalizeTranslationLanguage(req.params.lang);
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;

    const job = await jobsModel
      .findOne({
        _id: jobId,
        company_id: companyData.company._id,
        deleted_at: null,
      })
      .lean();

    if (!job) {
      return ReturnAppData.getError({ res, status: 404, message: "job_not_found" });
    }

    const actorUserId = getAuthUserId(req) || companyData.userId;
    const result = await upsertContentTranslation({
      entityType: "job",
      entityId: job._id,
      targetLanguage,
      sourceLanguage: req.body.source_language || req.body.sourceLanguage,
      originalText: req.body.original_text || req.body.original || buildJobOriginalText(job),
      translatedText: pickTranslatedFields(req.body || {}),
      aiRequestId: req.body.ai_request_id || req.body.aiRequestId,
      jobId: job._id,
      companyId: companyData.company._id,
      userId: actorUserId,
      approve: req.body.approve === true,
      status: req.body.status,
      rejectedBy: actorUserId,
      rejectionReason: req.body.rejection_reason,
      metadata: {
        source: clean(req.body.source || "manual_review"),
        ...normalizeMetadata(req.body),
      },
    });

    await writeAuditLog({
      req,
      companyId: companyData.company._id,
      actorUserId,
      actorType: companyActorType(req),
      action: result.approved ? "job_translation_approved" : "job_translation_saved",
      entityType: "translation",
      entityId: result.translation._id,
      jobId: job._id,
      newValue: {
        translation_id: result.translation._id,
        target_language: targetLanguage,
        status: result.translation.status,
        approval_required: result.approval_required,
      },
    });

    await recordAnalyticsEvent({
      req,
      event: "job_translated",
      entityType: "job",
      entityId: job._id,
      jobId: job._id,
      companyId: companyData.company._id,
      metadata: {
        translation_id: result.translation._id,
        target_language: targetLanguage,
        status: result.translation.status,
      },
    }).catch(() => null);

    return ReturnAppData.updateData({
      res,
      data: {
        translation: result.translation,
        approval_required: result.approval_required,
        can_publish: result.can_publish,
      },
      message: result.approved ? "job_translation_approved" : "job_translation_saved_for_approval",
    });
  } catch (error) {
    if (error.statusCode) {
      return ReturnAppData.getError({
        res,
        status: error.statusCode,
        message: error.code || error.message,
        other: { errors: { supported: error.supported } },
      });
    }

    return next(error);
  }
};

export default { getJobTranslation, saveJobTranslation };
