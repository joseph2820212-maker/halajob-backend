import mongoose from "mongoose";
import { EmailTemplateModel } from "../../models/index.js";

const clean = (value = "") => String(value || "").trim();
const objectIdOrNull = (value) => {
  const id = clean(value?._id || value);
  return mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null;
};

const pickTemplateFields = (body = {}) => {
  const out = {};
  [
    "key",
    "category",
    "subject",
    "preheader",
    "bodyBlocks",
    "variables",
    "fromName",
    "replyTo",
    "isMarketing",
    "status",
    "version",
  ].forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(body, key)) out[key] = body[key];
  });
  return out;
};

export const listCommunicationTemplates = async ({ query = {} } = {}) => {
  const filter = {};
  const q = clean(query.q || query.search);
  ["key", "category", "status"].forEach((key) => {
    const value = clean(query[key]);
    if (value) filter[key] = value;
  });
  if (q) {
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escaped, "i");
    filter.$or = [
      { key: regex },
      { category: regex },
      { "subject.en": regex },
      { "subject.ar": regex },
    ];
  }

  const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 50, 1), 200);
  return EmailTemplateModel.find(filter)
    .sort({ category: 1, key: 1 })
    .limit(limit)
    .lean();
};

export const createCommunicationTemplate = async (body = {}) => {
  const payload = pickTemplateFields(body);
  return EmailTemplateModel.create(payload);
};

export const updateCommunicationTemplate = async ({ id, body = {} } = {}) => {
  const templateId = objectIdOrNull(id);
  if (!templateId) {
    const error = new Error("invalid_template_id");
    error.statusCode = 400;
    throw error;
  }

  const template = await EmailTemplateModel.findByIdAndUpdate(
    templateId,
    { $set: pickTemplateFields(body) },
    { new: true, runValidators: true },
  ).lean();
  if (!template) {
    const error = new Error("communication_template_not_found");
    error.statusCode = 404;
    throw error;
  }
  return template;
};

export default {
  createCommunicationTemplate,
  listCommunicationTemplates,
  updateCommunicationTemplate,
};
