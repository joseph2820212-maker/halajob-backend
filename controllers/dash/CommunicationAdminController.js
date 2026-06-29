import mongoose from "mongoose";
import ReturnDashData from "../../helper/ReturnDashData/index.js";
import { CommunicationDeliveryLogModel } from "../../models/index.js";
import { sendCommunicationEvent } from "../../services/communication/communication.service.js";
import {
  createCommunicationTemplate,
  listCommunicationTemplates,
  updateCommunicationTemplate,
} from "../../services/communication/messageTemplate.service.js";

const clean = (value = "") => String(value || "").trim();
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(clean(id));
const toObjectId = (id) => (isValidObjectId(id) ? new mongoose.Types.ObjectId(clean(id)) : null);

const toInt = (value, fallback = 1, min = 1, max = 200) => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
};

const addObjectIdFilter = (filter, key, value) => {
  const id = clean(value);
  if (!id) return "";
  if (!isValidObjectId(id)) return `invalid_${key}`;
  filter[key] = toObjectId(id);
  return "";
};

export const listDeliveryLogs = async (req, res) => {
  try {
    const filter = {};
    ["channel", "status", "event_key", "category", "template_key", "provider"].forEach((key) => {
      const value = clean(req.query[key]);
      if (value) filter[key] = value;
    });

    for (const key of ["user_id", "company_id"]) {
      const error = addObjectIdFilter(filter, key, req.query[key]);
      if (error) return ReturnDashData.getError({ res, status: 400, message: error });
    }

    const page = toInt(req.query.page, 1, 1, 100000);
    const limit = toInt(req.query.limit, 25, 1, 200);
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      CommunicationDeliveryLogModel.find(filter).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit).lean(),
      CommunicationDeliveryLogModel.countDocuments(filter),
    ]);

    return ReturnDashData.getData({
      res,
      message: "communication_delivery_logs",
      data: items,
      other: {
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          has_next: page * limit < total,
          has_prev: page > 1,
        },
      },
    });
  } catch (error) {
    return ReturnDashData.getError({
      res,
      status: 500,
      message: error.message || "communication_logs_failed",
    });
  }
};

export const listTemplates = async (req, res) => {
  try {
    const templates = await listCommunicationTemplates({ query: req.query || {} });
    return ReturnDashData.getData({ res, message: "communication_templates", data: templates });
  } catch (error) {
    return ReturnDashData.getError({ res, status: 500, message: error.message || "communication_templates_failed" });
  }
};

export const createTemplate = async (req, res) => {
  try {
    const template = await createCommunicationTemplate(req.body || {});
    return ReturnDashData.createData({ res, message: "communication_template_created", data: template });
  } catch (error) {
    return ReturnDashData.getError({ res, status: error.statusCode || 400, message: error.message || "communication_template_create_failed" });
  }
};

export const updateTemplate = async (req, res) => {
  try {
    const template = await updateCommunicationTemplate({ id: req.params.id, body: req.body || {} });
    return ReturnDashData.updateData({ res, message: "communication_template_updated", data: template });
  } catch (error) {
    return ReturnDashData.getError({ res, status: error.statusCode || 400, message: error.message || "communication_template_update_failed" });
  }
};

export const testSend = async (req, res) => {
  try {
    const result = await sendCommunicationEvent({
      userId: req.body.user_id || req.body.userId || req.body.recipient_id,
      companyId: req.body.company_id || req.body.companyId,
      eventKey: req.body.event_key || req.body.event || "admin_test_send",
      category: req.body.category,
      channels: req.body.channels,
      templateKey: req.body.template_key || req.body.templateKey || "",
      variables: req.body.variables || req.body.params || {},
      route: req.body.route || {},
      respectPreferences: req.body.respect_preferences !== false && req.body.respectPreferences !== false,
    });
    return ReturnDashData.createData({ res, message: "communication_test_sent", data: result });
  } catch (error) {
    return ReturnDashData.getError({ res, status: error.statusCode || 400, message: error.message || "communication_test_send_failed" });
  }
};

export default {
  createTemplate,
  listDeliveryLogs,
  listTemplates,
  testSend,
  updateTemplate,
};
