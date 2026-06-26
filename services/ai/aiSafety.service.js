import crypto from "node:crypto";
import mongoose from "mongoose";
import {
  AiRequestModel,
  AiUsageLimitModel,
} from "../../models/index.js";
import { writeAuditLog } from "../auditLog.service.js";

export const AI_FEATURES = Object.freeze({
  career_copilot: {
    required_account: "employee",
    output_keys: ["next_best_actions", "readiness_summary", "suggested_jobs", "learning", "warnings"],
  },
  profile_score: {
    required_account: "employee",
    output_keys: ["score", "strengths", "missing_fields", "weak_sections", "recommended_edits"],
  },
  cv_rewrite: {
    required_account: "employee",
    output_keys: ["cv_sections", "ats_warnings", "language_tone", "before_after_changes"],
  },
  job_match_explanation: {
    required_account: "employee",
    output_keys: ["match_percent", "matched_skills", "missing_skills", "decision", "reason"],
  },
  job_cover_letter: {
    required_account: "employee",
    output_keys: ["cover_letter", "editable_sections", "risk_flags"],
  },
  interview_practice: {
    required_account: "employee",
    output_keys: ["questions", "answer_feedback", "score", "improvement_tips"],
  },
  company_job_generate: {
    required_account: "company",
    output_keys: ["title", "summary", "responsibilities", "requirements", "salary_guidance", "trust_warnings"],
  },
  company_shortlist: {
    required_account: "company",
    output_keys: ["rankings", "explanation", "missing_data", "bias_warnings"],
  },
  company_message_generate: {
    required_account: "company",
    output_keys: ["message_text", "tone", "placeholders", "human_review_required"],
  },
  translate_job: {
    required_account: "company",
    output_keys: ["source_language", "target_language", "translated_fields", "approval_required"],
  },
  translate_cv: {
    required_account: "employee",
    output_keys: ["source_language", "target_language", "translated_fields", "approval_required"],
  },
});

const TRUE_VALUES = new Set(["1", "true", "yes", "on"]);

const intFromEnv = (key, fallback) => {
  const value = Number.parseInt(process.env[key] || "", 10);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
};

const boolFromEnv = (key, fallback = false) => {
  const value = String(process.env[key] || "").trim().toLowerCase();
  if (!value) return fallback;
  return TRUE_VALUES.has(value);
};

const featureEnvKey = (feature, suffix) =>
  `HALA_AI_${String(feature || "").toUpperCase()}_${suffix}`;

export const normalizeAiFeatureKey = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const sortObject = (value) => {
  if (Array.isArray(value)) return value.map(sortObject);
  if (!value || typeof value !== "object") return value;

  return Object.keys(value)
    .sort()
    .reduce((acc, key) => {
      const item = value[key];
      if (typeof item !== "undefined" && typeof item !== "function") {
        acc[key] = sortObject(item);
      }
      return acc;
    }, {});
};

export const hashAiInput = (value = {}) =>
  crypto
    .createHash("sha256")
    .update(JSON.stringify(sortObject(value)))
    .digest("hex");

const idOf = (value) => String(value?._id || value?.id || value || "").trim();

const objectIdOrNull = (value) => {
  const id = idOf(value);
  return mongoose.Types.ObjectId.isValid(id) ? id : null;
};

const requestContext = (req = {}) => ({
  user_id: objectIdOrNull(req.user?._id || req.user?.id),
  active_context_id: idOf(req.activeContext?.id || req.activeContext?._id),
  active_context_type: String(req.activeContext?.context_type || "").trim(),
  company_id: objectIdOrNull(req.appAccount?.company?._id || req.activeContext?.company_id),
  employee_id: objectIdOrNull(req.appAccount?.employee?._id || req.activeContext?.employee_id),
});

const requestInput = (req = {}) => ({
  params: sortObject(req.params || {}),
  query: sortObject(req.query || {}),
  body: sortObject(req.body || {}),
});

const inputSummary = (req = {}, feature = "") => ({
  feature,
  param_keys: Object.keys(req.params || {}).sort(),
  query_keys: Object.keys(req.query || {}).sort(),
  body_keys: Object.keys(req.body || {}).sort(),
});

export const buildAiSafetyPayload = ({
  feature,
  requestId = null,
  status = "blocked",
  reason = "ai_feature_not_enabled",
  cached = false,
  output = null,
  usage = null,
} = {}) => ({
  ai_status: {
    feature,
    request_id: requestId ? String(requestId) : null,
    status,
    reason,
    cached,
  },
  safety: {
    suggestion_only: true,
    human_approval_required: true,
    auto_action_performed: false,
    editable_before_save: true,
  },
  usage,
  output,
});

const utcDayStart = (now = new Date()) =>
  new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

const utcMonthStart = (now = new Date()) =>
  new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

const defaultLimit = (feature) => ({
  enabled:
    boolFromEnv(featureEnvKey(feature, "ENABLED"), boolFromEnv("HALA_AI_ENABLED", false)),
  daily_limit: intFromEnv(featureEnvKey(feature, "DAILY_LIMIT"), intFromEnv("HALA_AI_DAILY_LIMIT", 20)),
  monthly_limit: intFromEnv(featureEnvKey(feature, "MONTHLY_LIMIT"), intFromEnv("HALA_AI_MONTHLY_LIMIT", 200)),
  provider: process.env.HALA_AI_PROVIDER || "",
  model: process.env.HALA_AI_MODEL || "",
});

const limitScopeCandidates = ({ user_id, active_context_id, company_id } = {}) => [
  active_context_id ? { scope_type: "context", scope_id: active_context_id } : null,
  company_id ? { scope_type: "company", scope_id: String(company_id) } : null,
  user_id ? { scope_type: "user", scope_id: String(user_id) } : null,
  { scope_type: "global", scope_id: "global" },
].filter(Boolean);

const resolveUsageLimit = async ({ feature, context }) => {
  const fallback = defaultLimit(feature);
  const candidates = limitScopeCandidates(context);
  const override = await AiUsageLimitModel.findOne({
    feature,
    is_active: { $ne: false },
    $or: candidates,
  })
    .sort({ updatedAt: -1 })
    .lean();

  if (!override) return fallback;
  return {
    enabled: override.enabled,
    daily_limit: Number.isFinite(Number(override.daily_limit))
      ? Number(override.daily_limit)
      : fallback.daily_limit,
    monthly_limit: Number.isFinite(Number(override.monthly_limit))
      ? Number(override.monthly_limit)
      : fallback.monthly_limit,
    provider: override.provider || fallback.provider,
    model: override.model || fallback.model,
  };
};

const createRequestRecord = async ({
  req,
  feature,
  input_hash,
  input_summary,
  status,
  error = "",
  output_json = null,
  provider = "",
  model = "",
  job_id = null,
}) => {
  const context = requestContext(req);
  return AiRequestModel.create({
    feature,
    input_hash,
    input_summary,
    output_json,
    provider,
    model,
    status,
    error,
    user_id: context.user_id,
    active_context_id: context.active_context_id,
    active_context_type: context.active_context_type,
    company_id: context.company_id,
    employee_id: context.employee_id,
    job_id: objectIdOrNull(job_id),
    request_ip: req?.ip || req?.headers?.["x-forwarded-for"] || "",
    user_agent: req?.headers?.["user-agent"] || "",
  });
};

const auditAiRequest = async ({ req, record, action, note = "", usage = null }) => {
  await writeAuditLog({
    req,
    companyId: record.company_id,
    actorUserId: record.user_id,
    actorType: record.company_id ? "company_member" : record.employee_id ? "employee" : "system",
    action,
    entityType: "other",
    entityId: record._id,
    jobId: record.job_id,
    note,
    newValue: {
      feature: record.feature,
      status: record.status,
      active_context_type: record.active_context_type,
      usage,
    },
  });
};

const countUsage = async ({ feature, context, from }) =>
  AiRequestModel.countDocuments({
    feature,
    user_id: context.user_id,
    active_context_id: context.active_context_id,
    status: { $in: ["processing", "completed", "cached"] },
    createdAt: { $gte: from },
  });

export const handleSafeAiRequest = async ({
  req,
  feature,
  jobId = null,
} = {}) => {
  const normalizedFeature = normalizeAiFeatureKey(feature);
  const config = AI_FEATURES[normalizedFeature];
  if (!config) {
    return {
      httpStatus: 404,
      success: false,
      message: "ai_feature_not_found",
      payload: buildAiSafetyPayload({ feature: normalizedFeature, reason: "unknown_feature" }),
    };
  }

  const context = requestContext(req);
  const input = requestInput(req);
  const input_hash = hashAiInput({
    feature: normalizedFeature,
    context_type: context.active_context_type,
    user_id: context.user_id,
    input,
  });

  const forceRegenerate =
    req.query?.regenerate === "true" ||
    req.query?.force === "true" ||
    req.body?.regenerate === true ||
    req.body?.force === true;

  if (!forceRegenerate) {
    const cached = await AiRequestModel.findOne({
      feature: normalizedFeature,
      user_id: context.user_id,
      active_context_id: context.active_context_id,
      input_hash,
      status: "completed",
    })
      .sort({ createdAt: -1 })
      .lean();

    if (cached) {
      return {
        httpStatus: 200,
        success: true,
        message: "ai_cached_result",
        payload: buildAiSafetyPayload({
          feature: normalizedFeature,
          requestId: cached._id,
          status: "completed",
          reason: "cached_result",
          cached: true,
          output: cached.output_json || null,
        }),
      };
    }
  }

  const limit = await resolveUsageLimit({ feature: normalizedFeature, context });
  const usage = {
    daily_limit: limit.daily_limit,
    monthly_limit: limit.monthly_limit,
    daily_used: await countUsage({ feature: normalizedFeature, context, from: utcDayStart() }),
    monthly_used: await countUsage({ feature: normalizedFeature, context, from: utcMonthStart() }),
  };

  const block = async (message, httpStatus = 503) => {
    const record = await createRequestRecord({
      req,
      feature: normalizedFeature,
      input_hash,
      input_summary: inputSummary(req, normalizedFeature),
      status: "blocked",
      error: message,
      provider: limit.provider,
      model: limit.model,
      job_id: jobId,
    });
    await auditAiRequest({ req, record, action: "ai_request_blocked", note: message, usage });
    return {
      httpStatus,
      success: false,
      message,
      payload: buildAiSafetyPayload({
        feature: normalizedFeature,
        requestId: record._id,
        reason: message,
        usage,
      }),
    };
  };

  if (!limit.enabled) return block("ai_feature_not_enabled", 503);
  if (usage.daily_limit > 0 && usage.daily_used >= usage.daily_limit) {
    return block("ai_daily_usage_limit_reached", 429);
  }
  if (usage.monthly_limit > 0 && usage.monthly_used >= usage.monthly_limit) {
    return block("ai_monthly_usage_limit_reached", 429);
  }

  if (!limit.provider || !limit.model) return block("ai_provider_not_configured", 503);

  return block("ai_provider_adapter_not_implemented", 503);
};
