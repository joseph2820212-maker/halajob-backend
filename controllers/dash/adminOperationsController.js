import mongoose from "mongoose";
import ReturnDashData from "../../helper/ReturnDashData/index.js";
import {
  AuditLogModel,
  CareerPassportModel,
  CompanyInvoiceModel,
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
  let query = model.find(filter).sort(options.sort || { createdAt: -1, _id: -1 }).skip(skip).limit(limit);
  if (options.populate) query = query.populate(options.populate);
  if (options.select) query = query.select(options.select);

  const [items, total] = await Promise.all([
    query.lean(),
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

const boolFilter = (value) => {
  if (typeof value === "boolean") return value;
  const normalized = clean(value).toLowerCase();
  if (!normalized) return null;
  if (["true", "1", "yes"].includes(normalized)) return true;
  if (["false", "0", "no"].includes(normalized)) return false;
  return null;
};

const invoicePopulate = [
  {
    path: "company_id",
    select: "company_name company_email email mobile image logo status accepted",
  },
  {
    path: "subscription_id",
    select: "plan_key status starts_at ends_at cancelled_at jobs_require_admin_approval",
  },
  {
    path: "plan_id",
    select: "key title_ar title_en price currency_code billing_period status",
  },
];

const careerPassportPopulate = [
  {
    path: "user_id",
    select: "first_name last_name email phone_e164 status role_id default_context_id",
  },
  {
    path: "employee_id",
    select: "profile_headline current_job_title candidate_stage profile_completion is_student status accepted image",
  },
  {
    path: "active_context_id",
    select: "context_type display_name status entity_id entity_model permissions",
  },
];

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

export const listInvoices = async (req, res) => {
  try {
    const filter = {};
    ["status", "currency_code", "billing_period", "plan_key", "payment_method"].forEach((key) => {
      const value = clean(req.query[key]);
      if (value) filter[key] = key === "currency_code" ? value.toUpperCase() : value.toLowerCase();
    });

    for (const key of ["company_id", "subscription_id", "plan_id"]) {
      const error = addObjectIdFilter(filter, key, req.query[key]);
      if (error) return failIfInvalid(res, error);
    }

    const dateError = addDateRangeFilter(filter, req);
    if (dateError) return failIfInvalid(res, dateError);

    const q = clean(req.query.q || req.query.search || req.query.invoice_no);
    if (q) {
      const regex = new RegExp(escapeRegex(q), "i");
      filter.$or = [
        { invoice_no: regex },
        { plan_key: regex },
        { status: regex },
        { billing_period: regex },
        { payment_method: regex },
        { transaction_ref: regex },
      ];
    }

    const result = await paginate(CompanyInvoiceModel, filter, req, {
      sort: { issued_at: -1, createdAt: -1, _id: -1 },
      populate: invoicePopulate,
    });
    return ReturnDashData.getData({
      res,
      data: result.items,
      other: { pagination: result.pagination },
      message: "company_invoices",
    });
  } catch (error) {
    return ReturnDashData.getError({ res, status: 500, message: error.message || "invoices_failed" });
  }
};

export const getInvoice = async (req, res) => {
  try {
    const invoiceId = clean(req.params.invoiceId || req.params.id);
    if (!isValidObjectId(invoiceId)) {
      return ReturnDashData.getError({ res, status: 400, message: "invalid_invoice_id" });
    }

    const invoice = await CompanyInvoiceModel.findById(invoiceId).populate(invoicePopulate).lean();
    if (!invoice) {
      return ReturnDashData.getError({ res, status: 404, message: "invoice_not_found" });
    }

    return ReturnDashData.getData({ res, data: invoice, message: "company_invoice" });
  } catch (error) {
    return ReturnDashData.getError({ res, status: 500, message: error.message || "invoice_failed" });
  }
};

export const listCareerPassports = async (req, res) => {
  try {
    const filter = {};
    const visibility = clean(req.query.visibility);
    if (visibility) filter.visibility = visibility;

    const shareEnabled = boolFilter(req.query.share_enabled);
    if (shareEnabled !== null) filter["share.enabled"] = shareEnabled;

    const generatedByAi = boolFilter(req.query.generated_by_ai);
    if (generatedByAi !== null) filter["score.generated_by_ai"] = generatedByAi;

    const minScore = Number.parseInt(clean(req.query.score_min), 10);
    const maxScore = Number.parseInt(clean(req.query.score_max), 10);
    const scoreFilter = {};
    if (Number.isFinite(minScore)) scoreFilter.$gte = Math.max(0, minScore);
    if (Number.isFinite(maxScore)) scoreFilter.$lte = Math.min(100, maxScore);
    if (Object.keys(scoreFilter).length) filter["score.total"] = scoreFilter;

    for (const key of ["user_id", "employee_id", "active_context_id"]) {
      const error = addObjectIdFilter(filter, key, req.query[key]);
      if (error) return failIfInvalid(res, error);
    }

    const dateError = addDateRangeFilter(filter, req);
    if (dateError) return failIfInvalid(res, dateError);

    const q = clean(req.query.q || req.query.search);
    if (q) {
      const regex = new RegExp(escapeRegex(q), "i");
      filter.$or = [
        { visibility: regex },
        { "score.source": regex },
        { "score.explanation": regex },
        { "snapshot.identity.full_name": regex },
        { "snapshot.identity.headline": regex },
        { "snapshot.identity.current_job_title": regex },
      ];
    }

    const result = await paginate(CareerPassportModel, filter, req, {
      sort: { updatedAt: -1, _id: -1 },
      populate: careerPassportPopulate,
    });
    return ReturnDashData.getData({
      res,
      data: result.items,
      other: { pagination: result.pagination },
      message: "career_passports",
    });
  } catch (error) {
    return ReturnDashData.getError({ res, status: 500, message: error.message || "career_passports_failed" });
  }
};

export const getCareerPassport = async (req, res) => {
  try {
    const passportId = clean(req.params.passportId || req.params.id);
    if (!isValidObjectId(passportId)) {
      return ReturnDashData.getError({ res, status: 400, message: "invalid_career_passport_id" });
    }

    const passport = await CareerPassportModel.findById(passportId).populate(careerPassportPopulate).lean();
    if (!passport) {
      return ReturnDashData.getError({ res, status: 404, message: "career_passport_not_found" });
    }

    return ReturnDashData.getData({ res, data: passport, message: "career_passport" });
  } catch (error) {
    return ReturnDashData.getError({ res, status: 500, message: error.message || "career_passport_failed" });
  }
};

export default {
  listAuditLogs,
  listTranslations,
  listNotificationLogs,
  listInvoices,
  getInvoice,
  listCareerPassports,
  getCareerPassport,
};
