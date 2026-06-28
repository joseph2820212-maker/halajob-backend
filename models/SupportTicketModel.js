import mongoose from "mongoose";

const { Schema } = mongoose;

const TicketMessageSchema = new Schema(
  {
    senderType: { type: String, enum: ["user", "admin", "system"], default: "user" },
    senderId: { type: Schema.Types.ObjectId, ref: "users", default: null },
    message: { type: String, default: "", trim: true },
    attachments: { type: [{ url: String, name: String, mime: String, size: Number }], default: [] },
    isInternalNote: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

// General support ticket for all roles (company tickets remain in CompanySupportTicketModel).
const SupportTicketSchema = new Schema(
  {
    ticketNo: { type: String, unique: true, index: true },
    requesterUserId: { type: Schema.Types.ObjectId, ref: "users", default: null, index: true },
    requesterRole: { type: String, enum: ["seeker", "company_user", "campus_student", "university_admin", "visitor", "admin"], default: "seeker", index: true },
    requesterEmail: { type: String, trim: true, default: "" },
    requesterName: { type: String, trim: true, default: "" },
    companyId: { type: Schema.Types.ObjectId, ref: "companies", default: null, index: true },
    universityId: { type: Schema.Types.ObjectId, default: null, index: true },
    category: {
      type: String,
      enum: ["account_login", "profile_cv", "job_search", "application_status", "company_dashboard", "job_posting", "applicant_management", "campus_verification", "university_dashboard", "ai_tools", "billing_subscription", "privacy_data", "trust_safety", "technical_bug", "accessibility", "legal_report", "other"],
      default: "other",
      index: true,
    },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    attachments: { type: [{ url: String, name: String, mime: String, size: Number }], default: [] },
    priority: { type: String, enum: ["low", "normal", "high", "urgent"], default: "normal", index: true },
    status: { type: String, enum: ["open", "waiting_for_user", "waiting_for_team", "escalated", "resolved", "closed"], default: "open", index: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: "users", default: null },
    messages: { type: [TicketMessageSchema], default: [] },
    source: { type: String, enum: ["mobile", "web", "admin", "email"], default: "mobile" },
    closedAt: { type: Date, default: null },
  },
  { collection: "support_tickets", timestamps: true }
);

SupportTicketSchema.index({ requesterUserId: 1, createdAt: -1 });
SupportTicketSchema.index({ status: 1, priority: 1, createdAt: -1 });

const SupportTicketModel = mongoose.model("support_tickets", SupportTicketSchema);
export default SupportTicketModel;
