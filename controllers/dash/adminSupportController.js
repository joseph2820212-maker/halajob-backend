import mongoose from "mongoose";
import ReturnDashData from "../../helper/ReturnDashData/index.js";
import { CompanySupportTicketModel } from "../../models/index.js";
import { writeAuditLog } from "../../services/auditLog.service.js";

const clean = (value = "") => String(value ?? "").trim();
const escapeRegex = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(String(id || ""));
const toObjectId = (id) => (isValidObjectId(id) ? new mongoose.Types.ObjectId(String(id)) : null);
const adminId = (req) => req.admin?._id || req.user?._id || null;

const ALLOWED_STATUSES = new Set(["open", "in_progress", "answered", "closed", "cancelled"]);
const ALLOWED_PRIORITIES = new Set(["low", "medium", "high", "urgent"]);
const ALLOWED_TYPES = new Set(["support", "feature_request", "bug_report", "faq", "whatsapp", "subscription_request"]);

const toInt = (value, fallback = 1, min = 1, max = 200) => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
};

const parseFiles = (body = {}) => {
  const value = body.attachments || body.files || [];
  if (Array.isArray(value)) return value.map(clean).filter(Boolean);
  return String(value || "").split(/[,;\n]+/).map(clean).filter(Boolean);
};

const paginate = async (filter, req) => {
  const page = toInt(req.query.page, 1, 1, 100000);
  const limit = toInt(req.query.limit, 25, 1, 200);
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    CompanySupportTicketModel.find(filter)
      .populate("company_id", "company_name company_email status accepted is_verified")
      .populate("created_by", "first_name mid_name last_name email phone_e164")
      .populate("assigned_to", "first_name mid_name last_name email")
      .populate("closed_by", "first_name mid_name last_name email")
      .sort({ priority: -1, updatedAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    CompanySupportTicketModel.countDocuments(filter),
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

const buildFilter = (req) => {
  const filter = {};
  const status = clean(req.query.status);
  const priority = clean(req.query.priority);
  const type = clean(req.query.type);

  if (status && status !== "all" && ALLOWED_STATUSES.has(status)) filter.status = status;
  if (priority && ALLOWED_PRIORITIES.has(priority)) filter.priority = priority;
  if (type && ALLOWED_TYPES.has(type)) filter.type = type;

  if (req.query.company_id) {
    if (!isValidObjectId(req.query.company_id)) return { error: "invalid_company_id" };
    filter.company_id = toObjectId(req.query.company_id);
  }

  if (req.query.assigned_to) {
    if (!isValidObjectId(req.query.assigned_to)) return { error: "invalid_assigned_to" };
    filter.assigned_to = toObjectId(req.query.assigned_to);
  }

  const q = clean(req.query.q || req.query.search);
  if (q) {
    const regex = new RegExp(escapeRegex(q), "i");
    filter.$or = [
      { ticket_no: regex },
      { subject: regex },
      { message: regex },
      { admin_note: regex },
      { "messages.message": regex },
    ];
    if (isValidObjectId(q)) filter.$or.push({ _id: toObjectId(q) }, { company_id: toObjectId(q) });
  }

  return { filter };
};

export const listTickets = async (req, res) => {
  try {
    const { filter, error } = buildFilter(req);
    if (error) return ReturnDashData.getError({ res, status: 400, message: error });
    const result = await paginate(filter, req);
    return ReturnDashData.getData({
      res,
      data: result.items,
      other: { pagination: result.pagination },
      message: "admin_support_tickets",
    });
  } catch (error) {
    return ReturnDashData.getError({ res, status: 500, message: error.message || "admin_support_tickets_failed" });
  }
};

export const getTicketDetails = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.ticketId)) {
      return ReturnDashData.getError({ res, status: 400, message: "invalid_ticket_id" });
    }

    const ticket = await CompanySupportTicketModel.findById(req.params.ticketId)
      .populate("company_id", "company_name company_email status accepted is_verified")
      .populate("created_by", "first_name mid_name last_name email phone_e164")
      .populate("assigned_to", "first_name mid_name last_name email")
      .populate("closed_by", "first_name mid_name last_name email")
      .populate("messages.sender_user_id", "first_name mid_name last_name email")
      .lean();

    if (!ticket) return ReturnDashData.getError({ res, status: 404, message: "support_ticket_not_found" });
    return ReturnDashData.getData({ res, data: ticket, message: "admin_support_ticket_details" });
  } catch (error) {
    return ReturnDashData.getError({ res, status: 500, message: error.message || "admin_support_ticket_failed" });
  }
};

export const updateTicketStatus = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.ticketId)) {
      return ReturnDashData.updateError({ res, status: 400, message: "invalid_ticket_id" });
    }

    const status = clean(req.body.status);
    if (!ALLOWED_STATUSES.has(status)) {
      return ReturnDashData.updateError({ res, status: 422, message: "invalid_support_ticket_status" });
    }

    const patch = {
      status,
      admin_note: clean(req.body.admin_note || req.body.note),
    };

    if (req.body.priority !== undefined) {
      const priority = clean(req.body.priority);
      if (!ALLOWED_PRIORITIES.has(priority)) {
        return ReturnDashData.updateError({ res, status: 422, message: "invalid_support_ticket_priority" });
      }
      patch.priority = priority;
    }

    if (req.body.assigned_to !== undefined) {
      const assignedTo = clean(req.body.assigned_to);
      if (assignedTo && !isValidObjectId(assignedTo)) {
        return ReturnDashData.updateError({ res, status: 400, message: "invalid_assigned_to" });
      }
      patch.assigned_to = assignedTo ? toObjectId(assignedTo) : null;
      patch.assigned_at = assignedTo ? new Date() : null;
    }

    if (status === "closed") {
      patch.closed_at = new Date();
      patch.closed_by = adminId(req);
    } else {
      patch.closed_at = null;
      patch.closed_by = null;
    }

    const before = await CompanySupportTicketModel.findById(req.params.ticketId).lean();
    if (!before) return ReturnDashData.updateError({ res, status: 404, message: "support_ticket_not_found" });

    const ticket = await CompanySupportTicketModel.findByIdAndUpdate(
      req.params.ticketId,
      { $set: patch },
      { new: true, runValidators: true }
    )
      .populate("company_id", "company_name company_email status accepted is_verified")
      .populate("assigned_to", "first_name mid_name last_name email")
      .populate("closed_by", "first_name mid_name last_name email")
      .lean();

    await writeAuditLog({
      req,
      companyId: before.company_id,
      actorUserId: adminId(req),
      actorType: "admin",
      action: "support_ticket_status_updated",
      entityType: "support_ticket",
      entityId: before._id,
      oldValue: {
        status: before.status,
        priority: before.priority,
        assigned_to: before.assigned_to,
        admin_note: before.admin_note,
      },
      newValue: patch,
      note: clean(req.body.admin_note || req.body.note),
    });

    return ReturnDashData.updateData({ res, data: ticket, message: "support_ticket_status_updated" });
  } catch (error) {
    return ReturnDashData.updateError({ res, status: 500, message: error.message || "support_ticket_status_update_failed" });
  }
};

export const addAdminMessage = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.ticketId)) {
      return ReturnDashData.updateError({ res, status: 400, message: "invalid_ticket_id" });
    }

    const message = clean(req.body.message);
    if (!message) return ReturnDashData.updateError({ res, status: 422, message: "ticket_message_required" });

    const before = await CompanySupportTicketModel.findById(req.params.ticketId).lean();
    if (!before) return ReturnDashData.updateError({ res, status: 404, message: "support_ticket_not_found" });

    const patch = {
      last_admin_response_at: new Date(),
      status: before.status === "closed" ? "closed" : "answered",
    };

    const ticket = await CompanySupportTicketModel.findByIdAndUpdate(
      req.params.ticketId,
      {
        $set: patch,
        $push: {
          messages: {
            sender_user_id: adminId(req),
            sender_type: "admin",
            message,
            attachments: parseFiles(req.body),
          },
        },
      },
      { new: true, runValidators: true }
    )
      .populate("company_id", "company_name company_email status accepted is_verified")
      .populate("created_by", "first_name mid_name last_name email phone_e164")
      .populate("messages.sender_user_id", "first_name mid_name last_name email")
      .lean();

    await writeAuditLog({
      req,
      companyId: before.company_id,
      actorUserId: adminId(req),
      actorType: "admin",
      action: "support_ticket_admin_message_added",
      entityType: "support_ticket",
      entityId: before._id,
      note: message,
    });

    return ReturnDashData.updateData({ res, data: ticket, message: "support_ticket_admin_message_added" });
  } catch (error) {
    return ReturnDashData.updateError({ res, status: 500, message: error.message || "support_ticket_message_failed" });
  }
};

export default {
  listTickets,
  getTicketDetails,
  updateTicketStatus,
  addAdminMessage,
};
