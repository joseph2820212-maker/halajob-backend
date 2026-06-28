import crypto from "crypto";
import { SupportTicketModel } from "../../../models/index.js";
import ReturnAppData from "../../../helper/ReturnAppData/index.js";
import { writeAuditLog } from "../../../services/auditLog.service.js";

const VALID_CATEGORIES = SupportTicketModel.schema.path("category").enumValues;

const makeTicketNo = () => `HS-${Date.now().toString(36).toUpperCase()}-${crypto.randomInt(1000, 9999)}`;

const roleOf = (user) => {
  const ctx = user?.active_context_type || user?.role_context || "";
  if (ctx.includes("company")) return "company_user";
  if (ctx.includes("university")) return "university_admin";
  if (ctx.includes("campus") || ctx.includes("student")) return "campus_student";
  return "seeker";
};

const createTicket = async (req, res, next) => {
  try {
    const body = req.body || {};
    const subject = typeof body.subject === "string" ? body.subject.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";
    if (!subject || !message) {
      return ReturnAppData.getError({ res, status: 400, message: "subject_and_message_required" });
    }
    const category = VALID_CATEGORIES.includes(body.category) ? body.category : "other";
    const ticket = await SupportTicketModel.create({
      ticketNo: makeTicketNo(),
      requesterUserId: req.user._id,
      requesterRole: roleOf(req.user),
      requesterEmail: req.user.email || "",
      requesterName: [req.user.first_name, req.user.last_name].filter(Boolean).join(" "),
      category,
      subject,
      message,
      source: body.source === "web" ? "web" : "mobile",
      messages: [{ senderType: "user", senderId: req.user._id, message }],
    });
    await writeAuditLog({ req, actorUserId: req.user._id, actorType: "employee", action: "support_ticket_created", entityType: "support_ticket", entityId: ticket._id, note: category });
    return ReturnAppData.createData({ res, data: { ticketNo: ticket.ticketNo, _id: ticket._id, status: ticket.status }, message: "support_ticket_created" });
  } catch (error) {
    return next(error);
  }
};

const listMyTickets = async (req, res, next) => {
  try {
    const tickets = await SupportTicketModel.find({ requesterUserId: req.user._id })
      .select("ticketNo subject category status priority updatedAt createdAt")
      .sort("-createdAt")
      .lean();
    return ReturnAppData.getData({ res, data: tickets, message: "support_tickets" });
  } catch (error) {
    return next(error);
  }
};

const getTicket = async (req, res, next) => {
  try {
    const ticket = await SupportTicketModel.findOne({ _id: req.params.id, requesterUserId: req.user._id }).lean();
    if (!ticket) return ReturnAppData.getError({ res, status: 404, message: "ticket_not_found" });
    // Hide internal notes from the requester.
    ticket.messages = (ticket.messages || []).filter((m) => !m.isInternalNote);
    return ReturnAppData.getData({ res, data: ticket, message: "support_ticket" });
  } catch (error) {
    return next(error);
  }
};

const addMessage = async (req, res, next) => {
  try {
    const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
    if (!message) return ReturnAppData.getError({ res, status: 400, message: "message_required" });
    const ticket = await SupportTicketModel.findOne({ _id: req.params.id, requesterUserId: req.user._id });
    if (!ticket) return ReturnAppData.getError({ res, status: 404, message: "ticket_not_found" });
    if (ticket.status === "closed") return ReturnAppData.getError({ res, status: 400, message: "ticket_closed" });
    ticket.messages.push({ senderType: "user", senderId: req.user._id, message });
    ticket.status = "waiting_for_team";
    await ticket.save();
    return ReturnAppData.updateData({ res, data: { status: ticket.status }, message: "message_added" });
  } catch (error) {
    return next(error);
  }
};

const closeTicket = async (req, res, next) => {
  try {
    const ticket = await SupportTicketModel.findOne({ _id: req.params.id, requesterUserId: req.user._id });
    if (!ticket) return ReturnAppData.getError({ res, status: 404, message: "ticket_not_found" });
    ticket.status = "closed";
    ticket.closedAt = new Date();
    await ticket.save();
    return ReturnAppData.updateData({ res, data: { status: ticket.status }, message: "ticket_closed" });
  } catch (error) {
    return next(error);
  }
};

export default { createTicket, listMyTickets, getTicket, addMessage, closeTicket };
