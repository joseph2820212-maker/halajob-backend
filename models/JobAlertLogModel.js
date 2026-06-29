import mongoose from "mongoose";

const { Schema } = mongoose;

const JobAlertLogSchema = new Schema(
  {
    saved_search_id: { type: Schema.Types.ObjectId, ref: "saved_searches", required: true, index: true },
    user_id: { type: Schema.Types.ObjectId, ref: "users", required: true, index: true },
    job_id: { type: Schema.Types.ObjectId, ref: "jobs", required: true, index: true },
    channel: { type: String, trim: true, default: "in_app", index: true },
    status: {
      type: String,
      enum: ["queued", "sent", "skipped", "failed"],
      default: "queued",
      index: true,
    },
    reason: { type: String, trim: true, default: "" },
    sent_at: { type: Date, default: null },
  },
  { collection: "job_alert_logs", timestamps: true },
);

JobAlertLogSchema.index(
  { saved_search_id: 1, job_id: 1, channel: 1 },
  { unique: true },
);
JobAlertLogSchema.index({ user_id: 1, createdAt: -1 });
JobAlertLogSchema.index({ saved_search_id: 1, status: 1, createdAt: -1 });

const JobAlertLogModel = mongoose.model("job_alert_logs", JobAlertLogSchema);

export default JobAlertLogModel;
