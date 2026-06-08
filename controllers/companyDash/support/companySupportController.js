import { CompanySupportTicketModel } from "../../../models/index.js";
import { getCompanyUserIdOrFail, success, fail, paginate, isValidObjectId } from "../../../helper/companyDash/companyDashHelpers.js";
import { writeAuditLog } from "../../../services/auditLog.service.js";

const cleanText = (value = "") => String(value ?? "").trim();
const parseFiles = (body = {}) => {
  const value = body.attachments || body.files || [];
  if (Array.isArray(value)) return value.map(cleanText).filter(Boolean);
  return String(value || "").split(/[,;\n]+/).map(cleanText).filter(Boolean);
};

export const listTickets = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;
    const filter = { company_id: companyData.company._id };
    if (req.query.status) filter.status = cleanText(req.query.status);
    if (req.query.type) filter.type = cleanText(req.query.type);
    const result = await paginate(CompanySupportTicketModel, filter, req, { sort: { createdAt: -1, _id: -1 }, lean: true });
    return success(res, result.items, "company_support_tickets", 200, result.meta);
  } catch (error) { next(error); }
};

export const createTicket = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;
    const payload = {
      company_id: companyData.company._id,
      created_by: companyData.userId,
      type: ["support", "feature_request", "bug_report", "faq", "whatsapp"].includes(req.body.type) ? req.body.type : "support",
      subject: cleanText(req.body.subject || req.body.title),
      message: cleanText(req.body.message || req.body.description),
      priority: ["low", "medium", "high", "urgent"].includes(req.body.priority) ? req.body.priority : "medium",
      attachments: parseFiles(req.body),
    };
    if (!payload.subject || !payload.message) return fail(res, "ticket_subject_message_required", 422);
    const ticket = await CompanySupportTicketModel.create(payload);
    await writeAuditLog({ req, companyId: companyData.company._id, actorUserId: companyData.userId, actorType: "company_owner", action: "support_ticket_created", entityType: "support_ticket", entityId: ticket._id, newValue: payload });
    return success(res, ticket, "support_ticket_created", 201);
  } catch (error) { next(error); }
};

export const getTicketDetails = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;
    if (!isValidObjectId(req.params.ticketId)) return fail(res, "invalid_ticket_id", 400);
    const ticket = await CompanySupportTicketModel.findOne({ _id: req.params.ticketId, company_id: companyData.company._id }).lean();
    if (!ticket) return fail(res, "support_ticket_not_found", 404);
    return success(res, ticket, "support_ticket_details");
  } catch (error) { next(error); }
};

export const addTicketMessage = async (req, res, next) => {
  try {
    const companyData = await getCompanyUserIdOrFail(req, res);
    if (!companyData) return;
    if (!isValidObjectId(req.params.ticketId)) return fail(res, "invalid_ticket_id", 400);
    const message = cleanText(req.body.message);
    if (!message) return fail(res, "ticket_message_required", 422);
    const ticket = await CompanySupportTicketModel.findOneAndUpdate(
      { _id: req.params.ticketId, company_id: companyData.company._id },
      { $push: { messages: { sender_user_id: companyData.userId, sender_type: "company", message, attachments: parseFiles(req.body) } } },
      { new: true }
    );
    if (!ticket) return fail(res, "support_ticket_not_found", 404);
    await writeAuditLog({ req, companyId: companyData.company._id, actorUserId: companyData.userId, actorType: "company_owner", action: "support_ticket_message_added", entityType: "support_ticket", entityId: ticket._id, note: message });
    return success(res, ticket, "support_ticket_message_added");
  } catch (error) { next(error); }
};

export default { listTickets, createTicket, getTicketDetails, addTicketMessage };
