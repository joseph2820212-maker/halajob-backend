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
    note: { type: String, default: "", trim: true },
  },
  { collection: "application_status_history", timestamps: true }
);
ApplicationStatusHistorySchema.index({ application_id: 1, createdAt: -1 });
ApplicationStatusHistorySchema.index({ job_id: 1, createdAt: -1 });
const ApplicationStatusHistoryModel = mongoose.model("application_status_history", ApplicationStatusHistorySchema);
export default ApplicationStatusHistoryModel;
