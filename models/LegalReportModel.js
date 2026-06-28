import mongoose from "mongoose";

const { Schema } = mongoose;

const InternalNoteSchema = new Schema(
  { adminId: { type: Schema.Types.ObjectId, ref: "users", default: null }, note: { type: String, default: "" }, createdAt: { type: Date, default: Date.now } },
  { _id: false }
);

// General legal / trust / abuse report (job-specific reports remain in JobReportModel).
const LegalReportSchema = new Schema(
  {
    reportNo: { type: String, unique: true, index: true },
    reporterUserId: { type: Schema.Types.ObjectId, ref: "users", default: null, index: true },
    reporterEmail: { type: String, trim: true, default: "" },
    reporterRole: { type: String, default: "visitor" },
    targetType: { type: String, enum: ["job", "company", "user", "message", "application", "campus_resource", "content", "other"], default: "other", index: true },
    targetId: { type: Schema.Types.ObjectId, default: null, index: true },
    reason: {
      type: String,
      enum: ["fake_job", "fake_company", "asks_for_money", "asks_for_sensitive_documents", "suspicious_external_contact", "discriminatory_content", "misleading_information", "impersonation", "harassment", "inappropriate_content", "copyright", "trademark", "privacy_concern", "other"],
      required: true,
      index: true,
    },
    description: { type: String, default: "", trim: true },
    attachments: { type: [{ url: String, name: String, mime: String, size: Number }], default: [] },
    status: { type: String, enum: ["received", "under_review", "action_needed", "action_taken", "rejected", "closed"], default: "received", index: true },
    severity: { type: String, enum: ["low", "normal", "high", "critical"], default: "normal", index: true },
    adminNotes: { type: [InternalNoteSchema], default: [] },
    outcome: { type: String, default: "" },
    notificationSent: { type: Boolean, default: false },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "users", default: null },
    reviewedAt: { type: Date, default: null },
  },
  { collection: "legal_reports", timestamps: true }
);

LegalReportSchema.index({ status: 1, severity: 1, createdAt: -1 });

const LegalReportModel = mongoose.model("legal_reports", LegalReportSchema);
export default LegalReportModel;
