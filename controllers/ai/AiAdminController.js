import mongoose from "mongoose";
import ReturnDashData from "../../helper/ReturnDashData/index.js";
import {
  AiRequestModel,
  AiUsageLimitModel,
} from "../../models/index.js";
import {
  AI_FEATURES,
  normalizeAiFeatureKey,
  normalizeAiProviderName,
} from "../../services/ai/aiSafety.service.js";
import { writeAuditLog } from "../../services/auditLog.service.js";

const TRUE_VALUES = new Set(["1", "true", "yes", "on"]);
const FALSE_VALUES = new Set(["0", "false", "no", "off"]);
const LIMIT_SCOPE_TYPES = new Set(["global", "user", "context", "company", "university"]);
const REQUEST_STATUSES = new Set(["queued", "processing", "completed", "failed", "blocked", "cached"]);

const clean = (value = "") => String(value || "").trim();
const adminId = (req) => req.admin?._id || req.user?._id || null;

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(String(id || ""));
const toObjectId = (id) => (isValidObjectId(id) ? new mongoose.Types.ObjectId(String(id)) : null);

const toInt = (value, fallback = 1, min = 0, max = 100000) => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
};

const toBool = (value, fallback = false) => {
  if (typeof value === "boolean") return value;
  const text = clean(value).toLowerCase();
  if (!text) return fallback;
  if (TRUE_VALUES.has(text)) return true;
  if (FALSE_VALUES.has(text)) return false;
  return fallback;
};

const pageOptions = (req) => {
  const page = toInt(req.query.page, 1, 1, 100000);
  const limit = toInt(req.query.limit, 20, 1, 200);
  return { page, limit, skip: (page - 1) * limit };
};

const pagination = ({ page, limit, total }) => ({
  page,
  limit,
  total,
  pages: Math.ceil(total / limit),
  has_next: page * limit < total,
  has_prev: page > 1,
});

const normalizeScope = ({ scopeType, scopeId }) => {
  const scope_type = clean(scopeType || "global").toLowerCase();
  if (!LIMIT_SCOPE_TYPES.has(scope_type)) return { error: "invalid_ai_limit_scope_type" };

  const scope_id = scope_type === "global" ? "global" : clean(scopeId);
  if (scope_type !== "global" && !scope_id) return { error: "ai_limit_scope_id_required" };

  return { scope_type, scope_id };
};

const featureOrError = (value) => {
  const feature = normalizeAiFeatureKey(value);
  if (!feature || !AI_FEATURES[feature]) return { error: "invalid_ai_feature" };
  return { feature };
};

const limitFilterFromQuery = (req) => {
  const filter = {};
  const feature = normalizeAiFeatureKey(req.query.feature);
  if (feature) filter.feature = feature;

  const scopeType = clean(req.query.scope_type || req.query.scopeType).toLowerCase();
  if (scopeType) filter.scope_type = scopeType;

  const scopeId = clean(req.query.scope_id || req.query.scopeId);
  if (scopeId) filter.scope_id = scopeId;

  if (typeof req.query.active !== "undefined" || typeof req.query.is_active !== "undefined") {
    filter.is_active = toBool(req.query.active ?? req.query.is_active, true);
  } else {
    filter.is_active = { $ne: false };
  }

  return filter;
};

const requestFilterFromQuery = (req) => {
  const filter = {};
  const feature = normalizeAiFeatureKey(req.query.feature);
  if (feature) filter.feature = feature;

  const status = clean(req.query.status).toLowerCase();
  if (status) {
    if (!REQUEST_STATUSES.has(status)) return { error: "invalid_ai_request_status" };
    filter.status = status;
  }

  const provider = normalizeAiProviderName(req.query.provider);
  if (provider) filter.provider = provider;

  const activeContextId = clean(req.query.active_context_id || req.query.context_id);
  if (activeContextId) filter.active_context_id = activeContextId;

  const activeContextType = clean(req.query.active_context_type || req.query.context_type);
  if (activeContextType) filter.active_context_type = activeContextType;

  const objectIdFields = [
    ["user_id", req.query.user_id],
    ["company_id", req.query.company_id],
    ["employee_id", req.query.employee_id],
    ["job_id", req.query.job_id],
  ];
  for (const [field, value] of objectIdFields) {
    const id = clean(value);
    if (!id) continue;
    if (!isValidObjectId(id)) return { error: `invalid_${field}` };
    filter[field] = toObjectId(id);
  }

  const createdAt = {};
  const from = clean(req.query.from || req.query.start_date);
  const to = clean(req.query.to || req.query.end_date);
  if (from) {
    const date = new Date(from);
    if (Number.isNaN(date.valueOf())) return { error: "invalid_ai_request_from_date" };
    createdAt.$gte = date;
  }
  if (to) {
    const date = new Date(to);
    if (Number.isNaN(date.valueOf())) return { error: "invalid_ai_request_to_date" };
    createdAt.$lte = date;
  }
  if (Object.keys(createdAt).length) filter.createdAt = createdAt;

  return { filter };
};

const writeAdminAudit = async ({ req, action, entityId, note, newValue }) =>
  writeAuditLog({
    req,
    actorUserId: adminId(req),
    actorType: "admin",
    action,
    entityType: "other",
    entityId,
    note,
    newValue,
  });

export const listFeatures = async (req, res) => {
  try {
    const limits = await AiUsageLimitModel.find({ is_active: { $ne: false } })
      .sort({ feature: 1, scope_type: 1, scope_id: 1 })
      .lean();

    const byFeature = limits.reduce((acc, limit) => {
      if (!acc[limit.feature]) acc[limit.feature] = [];
      acc[limit.feature].push(limit);
      return acc;
    }, {});

    const data = Object.entries(AI_FEATURES).map(([feature, config]) => ({
      feature,
      required_account: config.required_account,
      output_keys: config.output_keys,
      limits: byFeature[feature] || [],
    }));

    return ReturnDashData.getData({
      res,
      data,
      other: {
        provider_configured: Boolean(process.env.HALA_AI_PROVIDER && process.env.HALA_AI_MODEL),
        provider_key_configured: Boolean(process.env.HALA_AI_API_KEY || process.env.OPENAI_API_KEY),
      },
      message: "ai_features",
    });
  } catch (error) {
    return ReturnDashData.getError({ res, status: 500, message: error.message || "ai_features_failed" });
  }
};

export const listLimits = async (req, res) => {
  try {
    const { page, limit, skip } = pageOptions(req);
    const filter = limitFilterFromQuery(req);
    const [items, total] = await Promise.all([
      AiUsageLimitModel.find(filter).sort({ feature: 1, scope_type: 1, scope_id: 1 }).skip(skip).limit(limit).lean(),
      AiUsageLimitModel.countDocuments(filter),
    ]);

    return ReturnDashData.getData({
      res,
      data: items,
      other: { pagination: pagination({ page, limit, total }) },
      message: "ai_usage_limits",
    });
  } catch (error) {
    return ReturnDashData.getError({ res, status: 500, message: error.message || "ai_usage_limits_failed" });
  }
};

const buildLimitUpdate = (body = {}) => {
  const update = {};
  if (typeof body.enabled !== "undefined") update.enabled = toBool(body.enabled, false);
  if (typeof body.daily_limit !== "undefined" || typeof body.dailyLimit !== "undefined") {
    update.daily_limit = toInt(body.daily_limit ?? body.dailyLimit, 0, 0, 100000);
  }
  if (typeof body.monthly_limit !== "undefined" || typeof body.monthlyLimit !== "undefined") {
    update.monthly_limit = toInt(body.monthly_limit ?? body.monthlyLimit, 0, 0, 1000000);
  }
  if (typeof body.provider !== "undefined") update.provider = normalizeAiProviderName(body.provider);
  if (typeof body.model !== "undefined") update.model = clean(body.model).slice(0, 120);
  if (typeof body.note !== "undefined" || typeof body.admin_note !== "undefined") {
    update.note = clean(body.note ?? body.admin_note).slice(0, 500);
  }
  if (typeof body.is_active !== "undefined" || typeof body.active !== "undefined") {
    update.is_active = toBool(body.is_active ?? body.active, true);
  } else {
    update.is_active = true;
  }
  return update;
};

export const upsertLimit = async (req, res) => {
  try {
    const featureResult = featureOrError(req.body.feature || req.params.feature);
    if (featureResult.error) return ReturnDashData.updateError({ res, status: 400, message: featureResult.error });

    const scopeResult = normalizeScope({
      scopeType: req.body.scope_type || req.body.scopeType,
      scopeId: req.body.scope_id || req.body.scopeId,
    });
    if (scopeResult.error) return ReturnDashData.updateError({ res, status: 400, message: scopeResult.error });

    const query = {
      feature: featureResult.feature,
      scope_type: scopeResult.scope_type,
      scope_id: scopeResult.scope_id,
    };
    const update = buildLimitUpdate(req.body);

    const limit = await AiUsageLimitModel.findOneAndUpdate(
      query,
      { $set: update, $setOnInsert: query },
      { new: true, upsert: true, runValidators: true }
    ).lean();

    await writeAdminAudit({
      req,
      action: "ai_usage_limit_upserted",
      entityId: limit._id,
      note: `${limit.feature}:${limit.scope_type}:${limit.scope_id}`,
      newValue: limit,
    });

    return ReturnDashData.updateData({ res, data: limit, message: "ai_usage_limit_saved" });
  } catch (error) {
    return ReturnDashData.updateError({ res, status: 500, message: error.message || "ai_usage_limit_save_failed" });
  }
};

export const updateLimit = async (req, res) => {
  try {
    const id = req.params.id;
    if (!isValidObjectId(id)) return ReturnDashData.updateError({ res, status: 400, message: "invalid_ai_usage_limit_id" });

    const update = buildLimitUpdate(req.body);
    const limit = await AiUsageLimitModel.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true }).lean();
    if (!limit) return ReturnDashData.updateError({ res, status: 404, message: "ai_usage_limit_not_found" });

    await writeAdminAudit({
      req,
      action: "ai_usage_limit_updated",
      entityId: limit._id,
      note: `${limit.feature}:${limit.scope_type}:${limit.scope_id}`,
      newValue: limit,
    });

    return ReturnDashData.updateData({ res, data: limit, message: "ai_usage_limit_updated" });
  } catch (error) {
    return ReturnDashData.updateError({ res, status: 500, message: error.message || "ai_usage_limit_update_failed" });
  }
};

export const deactivateLimit = async (req, res) => {
  try {
    const id = req.params.id;
    if (!isValidObjectId(id)) return ReturnDashData.updateError({ res, status: 400, message: "invalid_ai_usage_limit_id" });

    const limit = await AiUsageLimitModel.findByIdAndUpdate(id, { $set: { is_active: false } }, { new: true }).lean();
    if (!limit) return ReturnDashData.updateError({ res, status: 404, message: "ai_usage_limit_not_found" });

    await writeAdminAudit({
      req,
      action: "ai_usage_limit_deactivated",
      entityId: limit._id,
      note: `${limit.feature}:${limit.scope_type}:${limit.scope_id}`,
      newValue: limit,
    });

    return ReturnDashData.updateData({ res, data: limit, message: "ai_usage_limit_deactivated" });
  } catch (error) {
    return ReturnDashData.updateError({ res, status: 500, message: error.message || "ai_usage_limit_deactivate_failed" });
  }
};

export const listRequests = async (req, res) => {
  try {
    const result = requestFilterFromQuery(req);
    if (result.error) return ReturnDashData.getError({ res, status: 400, message: result.error });

    const { page, limit, skip } = pageOptions(req);
    const includeOutput = toBool(req.query.include_output || req.query.output, false);
    let query = AiRequestModel.find(result.filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit);
    if (!includeOutput) query = query.select("-output_json");

    const [items, total] = await Promise.all([
      query.lean(),
      AiRequestModel.countDocuments(result.filter),
    ]);

    return ReturnDashData.getData({
      res,
      data: items,
      other: { pagination: pagination({ page, limit, total }) },
      message: "ai_requests",
    });
  } catch (error) {
    return ReturnDashData.getError({ res, status: 500, message: error.message || "ai_requests_failed" });
  }
};

export const getRequest = async (req, res) => {
  try {
    const id = req.params.id;
    if (!isValidObjectId(id)) return ReturnDashData.getError({ res, status: 400, message: "invalid_ai_request_id" });

    const request = await AiRequestModel.findById(id).lean();
    if (!request) return ReturnDashData.getError({ res, status: 404, message: "ai_request_not_found" });

    return ReturnDashData.getData({ res, data: request, message: "ai_request" });
  } catch (error) {
    return ReturnDashData.getError({ res, status: 500, message: error.message || "ai_request_failed" });
  }
};

export const summary = async (req, res) => {
  try {
    const result = requestFilterFromQuery(req);
    if (result.error) return ReturnDashData.getError({ res, status: 400, message: result.error });

    const match = result.filter;
    const [byFeature, byStatus, byProvider, recentErrors] = await Promise.all([
      AiRequestModel.aggregate([
        { $match: match },
        {
          $group: {
            _id: "$feature",
            total: { $sum: 1 },
            completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
            failed: { $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] } },
            blocked: { $sum: { $cond: [{ $eq: ["$status", "blocked"] }, 1, 0] } },
            tokens: { $sum: "$token_estimate" },
          },
        },
        { $sort: { total: -1, _id: 1 } },
      ]),
      AiRequestModel.aggregate([
        { $match: match },
        { $group: { _id: "$status", total: { $sum: 1 } } },
        { $sort: { total: -1, _id: 1 } },
      ]),
      AiRequestModel.aggregate([
        { $match: match },
        { $group: { _id: { provider: "$provider", model: "$model" }, total: { $sum: 1 }, tokens: { $sum: "$token_estimate" } } },
        { $sort: { total: -1 } },
      ]),
      AiRequestModel.find({
        ...match,
        status: { $in: ["failed", "blocked"] },
        error: { $ne: "" },
      })
        .select("feature status error provider model user_id active_context_id company_id job_id createdAt")
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
    ]);

    const total = byStatus.reduce((sum, row) => sum + row.total, 0);
    return ReturnDashData.getData({
      res,
      data: {
        total,
        by_feature: byFeature.map(({ _id, ...row }) => ({ feature: _id, ...row })),
        by_status: byStatus.map((row) => ({ status: row._id, total: row.total })),
        by_provider: byProvider.map((row) => ({
          provider: row._id.provider || "",
          model: row._id.model || "",
          total: row.total,
          tokens: row.tokens,
        })),
        recent_errors: recentErrors,
      },
      message: "ai_usage_summary",
    });
  } catch (error) {
    return ReturnDashData.getError({ res, status: 500, message: error.message || "ai_usage_summary_failed" });
  }
};

export default {
  listFeatures,
  listLimits,
  upsertLimit,
  updateLimit,
  deactivateLimit,
  listRequests,
  getRequest,
  summary,
};
