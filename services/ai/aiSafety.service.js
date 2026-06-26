import crypto from "node:crypto";
import axios from "axios";
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
const OPENAI_COMPATIBLE_PROVIDERS = new Set(["openai", "openai_compatible"]);
const SUPPORTED_AI_PROVIDERS = new Set(["mock", ...OPENAI_COMPATIBLE_PROVIDERS]);

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

export const normalizeAiProviderName = (value = "") =>
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

const trimTrailingSlash = (value = "") => String(value || "").trim().replace(/\/+$/g, "");

const providerApiKey = () =>
  String(process.env.HALA_AI_API_KEY || process.env.OPENAI_API_KEY || "").trim();

const providerTimeoutMs = () => {
  const value = intFromEnv("HALA_AI_TIMEOUT_MS", 30000);
  return value > 0 ? value : 30000;
};

const providerTemperature = () => {
  const value = Number.parseFloat(process.env.HALA_AI_TEMPERATURE || "");
  return Number.isFinite(value) && value >= 0 && value <= 2 ? value : 0.2;
};

export const buildAiProviderPrompt = ({ feature, outputKeys = [] } = {}) => [
  "You are Hala Job's backend AI assistant.",
  "Return only a valid JSON object. Do not wrap it in markdown and do not include prose outside JSON.",
  `The response must include these top-level keys: ${outputKeys.join(", ")}.`,
  `Feature: ${feature}.`,
  "All output is suggestion-only. Never claim that an application, shortlist, rejection, hire, message, translation, or profile edit has been submitted or saved.",
  "Avoid decisions or rankings based on protected characteristics. If data is missing or risky, put that in the relevant warnings or missing-data field.",
  "Keep the wording practical, editable, and suitable for a job platform in English unless the request asks for another language.",
].join("\n");

export const parseAiProviderJson = (value = "") => {
  if (value && typeof value === "object" && !Array.isArray(value)) return value;

  const text = String(value || "").trim();
  if (!text) {
    throw new Error("ai_provider_empty_response");
  }

  try {
    return JSON.parse(text);
  } catch {
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fenced?.[1]) return JSON.parse(fenced[1]);

    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(text.slice(start, end + 1));
    }

    throw new Error("ai_provider_invalid_json");
  }
};

const valueForMockKey = ({ key, feature, input }) => {
  const body = input?.body || {};
  switch (key) {
    case "score":
      return 72;
    case "match_percent":
      return 68;
    case "decision":
      return "Review fit manually before taking action";
    case "reason":
      return "Mock provider result for local verification; configure a live provider for production output.";
    case "cover_letter":
      return "Dear hiring team, this is an editable draft generated by the mock AI provider for local verification.";
    case "message_text":
      return "Hello, this is an editable hiring message draft from the mock AI provider. Please review before sending.";
    case "title":
      return body.title || "Editable job title draft";
    case "summary":
      return "Editable mock summary. Configure a live provider for production-grade generation.";
    case "salary_guidance":
      return "Review salary against the job location, seniority, and company policy before publishing.";
    case "tone":
      return "professional";
    case "human_review_required":
    case "approval_required":
      return true;
    case "source_language":
      return body.source_language || body.sourceLanguage || "auto";
    case "target_language":
      return body.target_language || body.targetLanguage || "en";
    case "translated_fields":
      return {};
    case "rankings":
      return [
        {
          candidate: "Candidate A",
          score: 72,
          explanation: "Mock ranking only; do not use for hiring decisions without live provider QA and human review.",
        },
      ];
    case "questions":
      return [
        {
          question: "Tell me about relevant experience for this role.",
          focus: "role fit",
        },
      ];
    case "answer_feedback":
      return "Practice answer feedback placeholder from the mock AI provider.";
    default:
      if (/warnings?|flags?|missing|weak|requirements|responsibilities|skills|strengths|edits|actions|jobs|learning|changes|sections|tips|placeholders/i.test(key)) {
        return [`Mock ${feature} ${key}. Replace with live provider output after production configuration.`];
      }
      return `Mock ${feature} ${key}.`;
  }
};

export const createMockAiOutput = ({ feature, outputKeys = [], input = {} } = {}) =>
  outputKeys.reduce((acc, key) => {
    acc[key] = valueForMockKey({ key, feature, input });
    return acc;
  }, {});

export const normalizeAiProviderOutput = ({ feature, output = {} } = {}) => {
  const config = AI_FEATURES[feature] || {};
  const source = output && typeof output === "object" && !Array.isArray(output) ? output : {};
  return (config.output_keys || []).reduce((acc, key) => {
    acc[key] = typeof source[key] === "undefined" ? null : source[key];
    return acc;
  }, {});
};

const runOpenAiCompatibleProvider = async ({ feature, config, input, provider, model }) => {
  const apiKey = providerApiKey();
  if (!apiKey) {
    const error = new Error("ai_provider_api_key_not_configured");
    error.publicMessage = "ai_provider_api_key_not_configured";
    error.httpStatus = 503;
    throw error;
  }

  const baseUrl = trimTrailingSlash(process.env.HALA_AI_BASE_URL || "https://api.openai.com/v1");
  const response = await axios.post(
    `${baseUrl}/chat/completions`,
    {
      model,
      temperature: providerTemperature(),
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: buildAiProviderPrompt({ feature, outputKeys: config.output_keys }),
        },
        {
          role: "user",
          content: JSON.stringify({
            feature,
            required_output_keys: config.output_keys,
            request: input,
          }),
        },
      ],
    },
    {
      timeout: providerTimeoutMs(),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    }
  );

  const content = response.data?.choices?.[0]?.message?.content;
  const parsed = parseAiProviderJson(content);
  const usage = response.data?.usage || {};
  return {
    output: normalizeAiProviderOutput({ feature, output: parsed }),
    provider,
    model,
    usage: {
      prompt_tokens: Number(usage.prompt_tokens || 0),
      completion_tokens: Number(usage.completion_tokens || 0),
      total_tokens: Number(usage.total_tokens || 0),
    },
  };
};

export const runAiProviderRequest = async ({ feature, config, input, provider, model } = {}) => {
  const normalizedProvider = normalizeAiProviderName(provider);
  if (normalizedProvider === "mock") {
    return {
      output: createMockAiOutput({ feature, outputKeys: config.output_keys, input }),
      provider: normalizedProvider,
      model,
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    };
  }

  if (OPENAI_COMPATIBLE_PROVIDERS.has(normalizedProvider)) {
    return runOpenAiCompatibleProvider({
      feature,
      config,
      input,
      provider: normalizedProvider,
      model,
    });
  }

  const error = new Error("ai_provider_not_supported");
  error.publicMessage = "ai_provider_not_supported";
  error.httpStatus = 503;
  throw error;
};

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

  const provider = normalizeAiProviderName(limit.provider);
  if (!SUPPORTED_AI_PROVIDERS.has(provider)) {
    return block("ai_provider_not_supported", 503);
  }
  if (
    provider === "mock" &&
    process.env.NODE_ENV === "production" &&
    !boolFromEnv("HALA_AI_ALLOW_MOCK_PROVIDER", false)
  ) {
    return block("ai_mock_provider_disabled_in_production", 503);
  }

  const record = await createRequestRecord({
    req,
    feature: normalizedFeature,
    input_hash,
    input_summary: inputSummary(req, normalizedFeature),
    status: "processing",
    provider,
    model: limit.model,
    job_id: jobId,
  });
  await auditAiRequest({
    req,
    record,
    action: "ai_request_started",
    note: "ai_provider_request_started",
    usage,
  });

  try {
    const providerResult = await runAiProviderRequest({
      feature: normalizedFeature,
      config,
      input,
      provider,
      model: limit.model,
    });
    const tokenEstimate = Number(providerResult.usage?.total_tokens || 0);

    record.status = "completed";
    record.output_json = providerResult.output;
    record.error = "";
    record.token_estimate = Number.isFinite(tokenEstimate) ? tokenEstimate : 0;
    await record.save();

    const providerUsage = {
      ...usage,
      provider: providerResult.provider,
      model: providerResult.model,
      prompt_tokens: providerResult.usage?.prompt_tokens || 0,
      completion_tokens: providerResult.usage?.completion_tokens || 0,
      total_tokens: providerResult.usage?.total_tokens || 0,
    };
    await auditAiRequest({
      req,
      record,
      action: "ai_request_completed",
      note: "ai_provider_request_completed",
      usage: providerUsage,
    });

    return {
      httpStatus: 200,
      success: true,
      message: "ai_completed",
      payload: buildAiSafetyPayload({
        feature: normalizedFeature,
        requestId: record._id,
        status: "completed",
        reason: "provider_result",
        output: providerResult.output,
        usage: providerUsage,
      }),
    };
  } catch (error) {
    const publicMessage = error.publicMessage || "ai_provider_request_failed";
    const errorMessage = String(error.message || publicMessage).slice(0, 500);
    record.status = "failed";
    record.error = errorMessage;
    await record.save();
    await auditAiRequest({
      req,
      record,
      action: "ai_request_failed",
      note: publicMessage,
      usage,
    });

    return {
      httpStatus: error.httpStatus || 502,
      success: false,
      message: publicMessage,
      payload: buildAiSafetyPayload({
        feature: normalizedFeature,
        requestId: record._id,
        status: "failed",
        reason: publicMessage,
        usage,
      }),
    };
  }
};
