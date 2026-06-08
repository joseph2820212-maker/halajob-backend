import mongoose from "mongoose";

const { Schema } = mongoose;

const TicketMessageSchema = new Schema(
  {
    sender_user_id: { type: Schema.Types.ObjectId, ref: "users", default: null },
    sender_type: { type: String, enum: ["company", "admin", "system"], default: "company" },
    message: { type: String, required: true, trim: true },
    attachments: { type: [String], default: [] },
  },
  { _id: true, timestamps: true }
);

const CompanySupportTicketSchema = new Schema(
  {
    ticket_no: { type: String, trim: true, unique: true, sparse: true, index: true },
    company_id: { type: Schema.Types.ObjectId, ref: "companies", required: true, index: true },
    created_by: { type: Schema.Types.ObjectId, ref: "users", default: null, index: true },
    type: { type: String, enum: ["support", "feature_request", "bug_report", "faq", "whatsapp"], default: "support", index: true },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    status: { type: String, enum: ["open", "in_progress", "answered", "closed", "cancelled"], default: "open", index: true },
    priority: { type: String, enum: ["low", "medium", "high", "urgent"], default: "medium", index: true },
    attachments: { type: [String], default: [] },
    messages: { type: [TicketMessageSchema], default: [] },
    closed_at: { type: Date, default: null },
  },
  { collection: "company_support_tickets", timestamps: true }
);

const buildTicketNo = (year, seq) => `TCK-${year}-${String(seq).padStart(5, "0")}`;

CompanySupportTicketSchema.pre("validate", async function (next) {
  try {
    if (!this.ticket_no) {
      const year = new Date().getFullYear();
      const count = await this.constructor.countDocuments({ ticket_no: new RegExp(`^TCK-${year}-`) });
      this.ticket_no = buildTicketNo(year, count + 1);
    }
    if (this.status === "closed" && !this.closed_at) this.closed_at = new Date();
    next();
  } catch (error) {
    next(error);
  }
});

CompanySupportTicketSchema.index({ company_id: 1, status: 1, createdAt: -1 });

const CompanySupportTicketModel = mongoose.model("company_support_tickets", CompanySupportTicketSchema);
export default CompanySupportTicketModel;
