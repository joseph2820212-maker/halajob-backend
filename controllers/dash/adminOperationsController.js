import mongoose from "mongoose";
import ReturnDashData from "../../helper/ReturnDashData/index.js";
import {
  AuditLogModel,
  ContentTranslationModel,
  NotificationModel,
} from "../../models/index.js";

const clean = (value = "") => String(value || "").trim();
const escapeRegex = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(String(id || ""));
const toObjectId = (id) => (isValidObjectId(id) ? new mongoose.Types.ObjectId(String(id)) : null);

const toInt = (value, fallback = 1, min = 1, max = 200) => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
};

const paginate = async (model, filter, req, options = {}) => {
  const page = toInt(req.query.page, 1, 1, 100000);
  const limit = toInt(req.query.limit, 25, 1, 200);
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    model.find(filter).sort(options.sort || { createdAt: -1, _id: -1 }).skip(skip).limit(limit).lean(),
    model.countDocuments(filter),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      has_next: page * limit < total,
      has_prev: page > 1,
    },
  };
};

const addObjectIdFilter = (filter, key, value) => {
  const id = clean(value);
  if (!id) return null;
  if (!isValidObjectId(id)) return `invalid_${key}`;
  filter[key] = toObjectId(id);
  return null;
};

const addDateRangeFilter = (filter, req) => {
  const createdAt = {};
  const from = clean(req.query.from || req.query.start_date);
  const to = clean(req.query.to || req.query.end_date);

  if (from) {
    const date = new Date(from);
    if (Number.isNaN(date.valueOf())) return "invalid_from_date";
    createdAt.$gte = date;
  }
  if (to) {
    const date = new Date(to);
    if (Number.isNaN(date.valueOf())) return "invalid_to_date";
    createdAt.$lte = date;
  }
  if (Object.keys(createdAt).length) filter.createdAt = createdAt;
  return null;
};

const failIfInvalid = (res, error) =>
  error ? ReturnDashData.getError({ res, status: 400, message: error }) : null;

export const listAuditLogs = async (req, res) => {
  try {
    const filter = {};
    const exactFields = ["actor_type", "entity_type", "action"];
    exactFields.forEach((key) => {
      const value = clean(req.query[key]);
      if (value) filter[key] = value;
    });

    for (const key of ["company_id", "actor_user_id", "entity_id", "job_id", "application_id"]) {
      const error = addObjectIdFilter(filter, key, req.query[key]);
      if (error) return failIfInvalid(res, error);
    }

    const dateError = addDateRangeFilter(filter, req);
    if (dateError) return failIfInvalid(res, dateError);

    const q = clean(req.query.q || req.query.search);
    if (q) {
      const regex = new RegExp(escapeRegex(q), "i");
      filter.$or = [{ action: regex }, { note: regex }, { ip: regex }, { user_agent: regex }];
    }

    const result = await paginate(AuditLogModel, filter, req);
    return ReturnDashData.getData({ res, data: result.items, other: { pagination: result.pagination }, message: "audit_logs" });
  } catch (error) {
    return ReturnDashData.getError({ res, status: 500, message: error.message || "audit_logs_failed" });
  }
};

export const listTranslations = async (req, res) => {
  try {
    const filter = {};
    ["entity_type", "source_language", "target_language", "status"].forEach((key) => {
      const value = clean(req.query[key]);
      if (value) filter[key] = value;
    });

    for (const key of ["entity_id", "job_id", "cv_id", "employee_id", "company_id", "user_id", "ai_request_id"]) {
      const error = addObjectIdFilter(filter, key, req.query[key]);
      if (error) return failIfInvalid(res, error);
    }

    const dateError = addDateRangeFilter(filter, req);
    if (dateError) return failIfInvalid(res, dateError);

    const q = clean(req.query.q || req.query.search);
    if (q) {
      const regex = new RegExp(escapeRegex(q), "i");
      filter.$or = [{ entity_type: regex }, { status: regex }, { rejection_reason: regex }];
    }

    const result = await paginate(ContentTranslationModel, filter, req, { sort: { updatedAt: -1, _id: -1 } });
    return ReturnDashData.getData({ res, data: result.items, other: { pagination: result.pagination }, message: "content_translations" });
  } catch (error) {
    return ReturnDashData.getError({ res, status: 500, message: error.message || "translations_failed" });
  }
};

export const listNotificationLogs = async (req, res) => {
  try {
    const filter = {};
    ["audience", "type", "route_key", "screen"].forEach((key) => {
      const value = clean(req.query[key]);
      if (value) filter[key] = value;
    });
    if (typeof req.query.read !== "undefined") {
      filter.read = req.query.read === true || req.query.read === "true";
    }

    const userError = addObjectIdFilter(filter, "user_id", req.query.user_id);
    if (userError) return failIfInvalid(res, userError);

    const dateError = addDateRangeFilter(filter, req);
    if (dateError) return failIfInvalid(res, dateError);

    const q = clean(req.query.q || req.query.search);
    if (q) {
      const regex = new RegExp(escapeRegex(q), "i");
      filter.$or = [{ title: regex }, { type: regex }, { audience: regex }, { route_key: regex }, { screen: regex }];
    }

    const result = await paginate(NotificationModel, filter, req);
    return ReturnDashData.getData({ res, data: result.items, other: { pagination: result.pagination }, message: "notification_logs" });
  } catch (error) {
    return ReturnDashData.getError({ res, status: 500, message: error.message || "notification_logs_failed" });
  }
};

export default {
  listAuditLogs,
  listTranslations,
  listNotificationLogs,
};
