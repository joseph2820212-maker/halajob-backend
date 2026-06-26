import mongoose from "mongoose";
import ReturnAppData from "../../helper/ReturnAppData/index.js";
import { EmployeeCvModel } from "../../models/index.js";
import {
  getAuthUserId,
  getEmployeePlain,
} from "../../helper/employeeDash/employeeDashHelpers.js";
import {
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
    "title",
    "profile_headline",
    "current_job_title",
    "about_me",
    "skills",
    "experience",
    "education",
    "languages",
    "student_profile",
    "career_passport",
  ];

  return fields.reduce((acc, field) => {
    if (body[field] !== undefined) acc[field] = body[field];
    return acc;
  }, {});
};

const skillTitle = (skill = {}) => clean(skill.title || skill.name || skill.skill_id?.title_en || skill.skill_id?.title_ar);
const languageTitle = (language = {}) => clean(language.name || language.language_id?.title_en || language.language_id?.title_ar);

const buildProfileOriginalText = (employee = {}, cv = null) => ({
  title: clean(cv?.title || "Career profile"),
  profile_headline: clean(employee.profile_headline),
  current_job_title: clean(employee.current_job_title),
  about_me: clean(employee.about_me),
  candidate_stage: clean(employee.candidate_stage),
  experience_years: employee.experience_years ?? null,
  work_location: clean(employee.work_location),
  current_country: clean(employee.current_country),
  current_city: clean(employee.current_city),
  student_profile: employee.student_profile || {},
  skills: (employee.skills || []).map((skill) => ({
    title: skillTitle(skill),
    level: skill.level ?? null,
    years: skill.years ?? null,
  })),
  experience: (employee.experience || []).map((item) => ({
    company_name: clean(item.company_name),
    position: clean(item.position),
    details: clean(item.details),
    start_date: item.start_date || null,
    end_date: item.end_date || null,
    is_until_now: item.is_until_now === true,
  })),
  education: (employee.education || []).map((item) => ({
    level: clean(item.level),
    study: clean(item.study),
    institution: clean(item.institution),
    start_date: item.start_date || null,
    end_date: item.end_date || null,
  })),
  languages: (employee.languages || []).map((language) => ({
    name: languageTitle(language),
    level: language.level ?? null,
  })),
});

const normalizeMetadata = (body = {}, cv = null) => ({
  source: clean(body.source || "manual_review"),
  cv_id: cv?._id || null,
  ...(isObject(body.metadata) ? body.metadata : {}),
});

const resolveCv = async ({ req, employee }) => {
  const requestedCvId = clean(req.body.cv_id || req.body.cvId || req.query.cv_id || req.query.cvId);
  if (requestedCvId && !mongoose.Types.ObjectId.isValid(requestedCvId)) {
    const error = new Error("invalid_cv_id");
    error.statusCode = 400;
    error.code = "invalid_cv_id";
    throw error;
  }

  if (requestedCvId) {
    const cv = await EmployeeCvModel.findOne({
      _id: requestedCvId,
      employee_id: employee._id,
    }).lean();
    if (!cv) {
      const error = new Error("cv_not_found");
      error.statusCode = 404;
      error.code = "cv_not_found";
      throw error;
    }

    return cv;
  }

  return EmployeeCvModel.findOne({ employee_id: employee._id })
    .sort({ is_default: -1, updatedAt: -1, createdAt: -1 })
    .lean();
};

const saveCvTranslation = async (req, res, next) => {
  try {
    const targetLanguage = normalizeTranslationLanguage(req.params.lang);
    const employee = await getEmployeePlain(req, res);
    if (!employee) return;

    const cv = await resolveCv({ req, employee });
    const actorUserId = getAuthUserId(req);
    const entityType = cv?._id ? "cv" : "career_passport";
    const entityId = cv?._id || employee._id;

    const result = await upsertContentTranslation({
      entityType,
      entityId,
      targetLanguage,
      sourceLanguage: req.body.source_language || req.body.sourceLanguage,
      originalText: req.body.original_text || req.body.original || buildProfileOriginalText(employee, cv),
      translatedText: pickTranslatedFields(req.body || {}),
      aiRequestId: req.body.ai_request_id || req.body.aiRequestId,
      cvId: cv?._id || null,
      employeeId: employee._id,
      userId: actorUserId,
      approve: req.body.approve === true,
      status: req.body.status,
      rejectedBy: actorUserId,
      rejectionReason: req.body.rejection_reason,
      metadata: normalizeMetadata(req.body, cv),
    });

    await writeAuditLog({
      req,
      actorUserId,
      actorType: "employee",
      action: result.approved ? "cv_translation_approved" : "cv_translation_saved",
      entityType: "translation",
      entityId: result.translation._id,
      newValue: {
        translation_id: result.translation._id,
        target_language: targetLanguage,
        status: result.translation.status,
        approval_required: result.approval_required,
        translated_entity_type: entityType,
      },
    });

    await recordAnalyticsEvent({
      req,
      event: "cv_translated",
      entityType,
      entityId,
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
      message: result.approved ? "cv_translation_approved" : "cv_translation_saved_for_approval",
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

export default { saveCvTranslation };
