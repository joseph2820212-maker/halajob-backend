import mongoose from "mongoose";
import { ContentTranslationModel } from "../../models/index.js";

const SUPPORTED_LANGUAGES = ["ar", "en"];
const APPROVABLE_STATUSES = ["draft", "pending_approval", "approved", "rejected"];

const clean = (value = "") => String(value || "").trim();

export const normalizeTranslationLanguage = (value) => {
  const language = clean(value).toLowerCase();
  if (!SUPPORTED_LANGUAGES.includes(language)) {
    const error = new Error("unsupported_translation_language");
    error.statusCode = 422;
    error.code = "unsupported_translation_language";
    error.supported = SUPPORTED_LANGUAGES;
    throw error;
  }

  return language;
};

export const inferSourceLanguage = (sourceLanguage, targetLanguage) => {
  if (sourceLanguage) return normalizeTranslationLanguage(sourceLanguage);
  return normalizeTranslationLanguage(targetLanguage) === "ar" ? "en" : "ar";
};

export const objectIdOrNull = (value) => {
  const id = clean(value?._id || value);
  return mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null;
};

const toPlain = (value) => {
  if (value === undefined || value === null) return value;
  if (typeof value?.toObject === "function") return value.toObject();
  return JSON.parse(JSON.stringify(value));
};

const hasTranslationContent = (value) => {
  if (typeof value === "string") return clean(value).length > 0;
  if (Array.isArray(value)) return value.some(hasTranslationContent);
  if (value && typeof value === "object") {
    return Object.values(value).some(hasTranslationContent);
  }
  return value !== undefined && value !== null;
};

const normalizeRequestedStatus = ({ approve, status }) => {
  if (approve === true || clean(status).toLowerCase() === "approved") return "approved";

  const requested = clean(status).toLowerCase();
  if (!requested) return "pending_approval";
  if (!APPROVABLE_STATUSES.includes(requested)) {
    const error = new Error("invalid_translation_status");
    error.statusCode = 422;
    error.code = "invalid_translation_status";
    error.supported = APPROVABLE_STATUSES;
    throw error;
  }

  return requested === "approved" ? "pending_approval" : requested;
};

export const upsertContentTranslation = async ({
  entityType,
  entityId,
  targetLanguage,
  sourceLanguage = "",
  originalText,
  translatedText,
  aiRequestId = null,
  jobId = null,
  cvId = null,
  employeeId = null,
  companyId = null,
  userId = null,
  approve = false,
  status = "",
  rejectedBy = null,
  rejectionReason = "",
  metadata = {},
}) => {
  const entityObjectId = objectIdOrNull(entityId);
  if (!entityObjectId) {
    const error = new Error("invalid_translation_entity_id");
    error.statusCode = 400;
    error.code = "invalid_translation_entity_id";
    throw error;
  }

  const target = normalizeTranslationLanguage(targetLanguage);
  const source = inferSourceLanguage(sourceLanguage, target);
  const resolvedStatus = normalizeRequestedStatus({ approve, status });
  const original = toPlain(originalText);
  const translated = toPlain(translatedText);

  if (!hasTranslationContent(original)) {
    const error = new Error("original_text_required");
    error.statusCode = 422;
    error.code = "original_text_required";
    throw error;
  }

  if (!hasTranslationContent(translated)) {
    const error = new Error("translated_text_required");
    error.statusCode = 422;
    error.code = "translated_text_required";
    throw error;
  }

  const actorId = objectIdOrNull(userId);
  const now = new Date();
  const approvalPatch =
    resolvedStatus === "approved"
      ? {
          approved_by: actorId,
          approved_at: now,
          rejected_by: null,
          rejected_at: null,
          rejection_reason: "",
        }
      : {
          approved_by: null,
          approved_at: null,
          rejected_by: resolvedStatus === "rejected" ? objectIdOrNull(rejectedBy || userId) : null,
          rejected_at: resolvedStatus === "rejected" ? now : null,
          rejection_reason: resolvedStatus === "rejected" ? clean(rejectionReason) : "",
        };

  const translation = await ContentTranslationModel.findOneAndUpdate(
    {
      entity_type: entityType,
      entity_id: entityObjectId,
      target_language: target,
    },
    {
      $set: {
        entity_type: entityType,
        entity_id: entityObjectId,
        source_language: source,
        target_language: target,
        original_text: original,
        translated_text: translated,
        ai_request_id: objectIdOrNull(aiRequestId),
        job_id: objectIdOrNull(jobId),
        cv_id: objectIdOrNull(cvId),
        employee_id: objectIdOrNull(employeeId),
        company_id: objectIdOrNull(companyId),
        user_id: actorId,
        approval_required: true,
        status: resolvedStatus,
        metadata: toPlain(metadata) || {},
        ...approvalPatch,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return {
    translation,
    approval_required: true,
    can_publish: translation.status === "approved",
    approved: translation.status === "approved",
  };
};

export default {
  normalizeTranslationLanguage,
  inferSourceLanguage,
  objectIdOrNull,
  upsertContentTranslation,
};
