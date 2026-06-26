import mongoose from "mongoose";

const { Schema } = mongoose;

const AuditLogSchema = new Schema(
  {
    company_id: { type: Schema.Types.ObjectId, ref: "companies", default: null, index: true },
    actor_user_id: { type: Schema.Types.ObjectId, ref: "users", default: null, index: true },
    actor_type: { type: String, enum: ["system", "admin", "company_owner", "company_member", "employee", "university_admin"], default: "system", index: true },
    action: { type: String, required: true, trim: true, index: true },
    entity_type: {
      type: String,
      enum: ["job", "application", "interview", "company", "company_member", "question_library", "message_template", "support_ticket", "subscription", "verification", "notification", "translation", "other"],
      default: "other",
      index: true,
    },
    entity_id: { type: Schema.Types.ObjectId, default: null, index: true },
    job_id: { type: Schema.Types.ObjectId, ref: "jobs", default: null, index: true },
    application_id: { type: Schema.Types.ObjectId, ref: "user_applying_job", default: null, index: true },
    old_value: { type: Schema.Types.Mixed, default: null },
    new_value: { type: Schema.Types.Mixed, default: null },
    note: { type: String, trim: true, default: "" },
    ip: { type: String, trim: true, default: "" },
    user_agent: { type: String, trim: true, default: "" },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { collection: "audit_logs", timestamps: true }
);

AuditLogSchema.index({ company_id: 1, createdAt: -1 });
AuditLogSchema.index({ company_id: 1, entity_type: 1, createdAt: -1 });
AuditLogSchema.index({ company_id: 1, job_id: 1, createdAt: -1 });
AuditLogSchema.index({ company_id: 1, application_id: 1, createdAt: -1 });

const AuditLogModel = mongoose.model("audit_logs", AuditLogSchema);
export default AuditLogModel;
