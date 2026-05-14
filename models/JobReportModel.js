import mongoose from "mongoose";
const { Schema } = mongoose;
const JobReportSchema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "users", required: true, index: true },
    job_id: { type: Schema.Types.ObjectId, ref: "jobs", required: true, index: true },
    company_id: { type: Schema.Types.ObjectId, ref: "companies", default: null, index: true },
    reason: { type: String, enum: ["fake_job", "spam", "scam", "wrong_information", "discrimination", "expired", "other"], required: true },
    message: { type: String, default: "", trim: true },
    status: { type: String, enum: ["pending", "reviewing", "resolved", "rejected"], default: "pending", index: true },
    reviewed_by: { type: Schema.Types.ObjectId, ref: "users", default: null },
    reviewed_at: { type: Date, default: null },
  },
  { collection: "job_reports", timestamps: true }
);
JobReportSchema.index({ user_id: 1, job_id: 1 }, { unique: true });
JobReportSchema.index({ status: 1, createdAt: -1 });
const JobReportModel = mongoose.model("job_reports", JobReportSchema);
export default JobReportModel;
