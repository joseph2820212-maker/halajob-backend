import { CompanyMessageTemplateModel } from "../../../models/index.js";
import { getCompanyUserIdOrFail, success, fail, paginate, isValidObjectId } from "../../../helper/companyDash/companyDashHelpers.js";
import { writeAuditLog } from "../../../services/auditLog.service.js";

const cleanText = (value = "") => String(value ?? "").trim();
const toBool = (value) => [true, "true", "1", 1, "yes", "on"].includes(value);
const normalizeKey = (value = "") => cleanText(value).toLowerCase().replace(/[^a-z0-9_-]+/g, "_").replace(/^_+|_+$/g, "");

const normalizePayload = (body = {}) => ({
  key: normalizeKey(body.key || body.title),
  title: cleanText(body.title),
  type: ["acceptance", "rejection", "interview", "offer", "general"].includes(body.type) ? body.type : "general",
  subject: cleanText(body.subject),
  body: cleanText(body.body || body.message),
  language: ["ar", "en"].includes(body.language) ? body.language : "ar",
  is_active: body.is_active === undefined ? true : toBool(body.is_active),
});

const normalizePatchPayload = (body = {}) => {
  const payload = {};

  if (body.key !== undefined) payload.key = normalizeKey(body.key);
  if (body.title !== undefined) payload.title = cleanText(body.title);
  if (body.type !== undefined) payload.type = ["acceptance", "rejection", "interview", "offer", "general"].includes(body.type) ? body.type : "general";
  if (body.subject !== undefined) payload.subject = cleanText(body.subject);
  if (body.body !== undefined || body.message !== undefined) payload.body = cleanText(body.body || body.message);
  if (body.language !== undefined) payload.language = ["ar", "en"].includes(body.language) ? body.language : "ar";
  if (body.is_active !== undefined) payload.is_active = toBool(body.is_active);

  return payload;
};

export const listTemplates = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;
    const filter = { company_id: companyData.company._id };
    if (req.query.type) filter.type = cleanText(req.query.type);
    if (req.query.language) filter.language = cleanText(req.query.language);
    if (req.query.is_active !== undefined) filter.is_active = toBool(req.query.is_active);
    const result = await paginate(CompanyMessageTemplateModel, filter, req, { sort: { createdAt: -1, _id: -1 }, lean: true });
    return success(res, result.items, "company_message_templates", 200, result.meta);
  } catch (error) { next(error); }
};

export const createTemplate = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;
    const payload = normalizePayload(req.body);
    if (!payload.key || !payload.title || !payload.body) return fail(res, "template_key_title_body_required", 422);
    const template = await CompanyMessageTemplateModel.create({ ...payload, company_id: companyData.company._id, created_by: companyData.userId });
    await writeAuditLog({ req, companyId: companyData.company._id, actorUserId: companyData.userId, actorType: "company_owner", action: "message_template_created", entityType: "message_template", entityId: template._id, newValue: payload });
    return success(res, template, "message_template_created", 201);
  } catch (error) {
    if (error?.code === 11000) return fail(res, "message_template_key_already_exists", 409);
    next(error);
  }
};

export const updateTemplate = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;
    if (!isValidObjectId(req.params.templateId)) return fail(res, "invalid_template_id", 400);
    const oldTemplate = await CompanyMessageTemplateModel.findOne({ _id: req.params.templateId, company_id: companyData.company._id }).lean();
    if (!oldTemplate) return fail(res, "message_template_not_found", 404);
    const payload = normalizePatchPayload(req.body);
    if (payload.key !== undefined && !payload.key) return fail(res, "template_key_required", 422);
    if (payload.title !== undefined && !payload.title) return fail(res, "template_title_required", 422);
    if (payload.body !== undefined && !payload.body) return fail(res, "template_body_required", 422);
    const template = await CompanyMessageTemplateModel.findOneAndUpdate({ _id: req.params.templateId, company_id: companyData.company._id }, { $set: payload }, { new: true, runValidators: true });
    await writeAuditLog({ req, companyId: companyData.company._id, actorUserId: companyData.userId, actorType: "company_owner", action: "message_template_updated", entityType: "message_template", entityId: template._id, oldValue: oldTemplate, newValue: payload });
    return success(res, template, "message_template_updated");
  } catch (error) { next(error); }
};

export const deleteTemplate = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;
    if (!isValidObjectId(req.params.templateId)) return fail(res, "invalid_template_id", 400);
    const template = await CompanyMessageTemplateModel.findOneAndUpdate({ _id: req.params.templateId, company_id: companyData.company._id }, { $set: { is_active: false } }, { new: true });
    if (!template) return fail(res, "message_template_not_found", 404);
    await writeAuditLog({ req, companyId: companyData.company._id, actorUserId: companyData.userId, actorType: "company_owner", action: "message_template_disabled", entityType: "message_template", entityId: template._id });
    return success(res, template, "message_template_disabled");
  } catch (error) { next(error); }
};

export default { listTemplates, createTemplate, updateTemplate, deleteTemplate };
