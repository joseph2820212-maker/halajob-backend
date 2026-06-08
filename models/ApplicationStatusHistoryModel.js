import mongoose from "mongoose";
const { Schema } = mongoose;
const ApplicationStatusHistorySchema = new Schema(
  {
    application_id: { type: Schema.Types.ObjectId, ref: "user_applying_job", required: true, index: true },
    job_id: { type: Schema.Types.ObjectId, ref: "jobs", required: true, index: true },
    company_id: { type: Schema.Types.ObjectId, ref: "companies", required: true, index: true },
    user_id: { type: Schema.Types.ObjectId, ref: "users", required: true, index: true },
    old_status: { type: String, default: null },
    new_status: { type: String, required: true, index: true },
    changed_by: { type: Schema.Types.ObjectId, ref: "users", default: null },
    actor_type: { type: String, enum: ["system", "company", "employee", "admin"], default: "system" },
    action: { type: String, trim: true, default: "status_changed", index: true },
    note: { type: String, default: "", trim: true },
    rejection_reason_code: { type: String, trim: true, default: "" },
    visible_to_candidate: { type: Boolean, default: false },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { collection: "application_status_history", timestamps: true }
);
ApplicationStatusHistorySchema.index({ application_id: 1, createdAt: -1 });
ApplicationStatusHistorySchema.index({ job_id: 1, createdAt: -1 });
const ApplicationStatusHistoryModel = mongoose.model("application_status_history", ApplicationStatusHistorySchema);
export default ApplicationStatusHistoryModel;
