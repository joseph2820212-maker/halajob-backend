import mongoose from "mongoose";

const { Schema } = mongoose;

const AnalyticsEventSchema = new Schema(
  {
    event: { type: String, required: true, trim: true, index: true },
    group: {
      type: String,
      enum: ["activation", "ai", "jobs", "company", "campus", "global"],
      required: true,
      index: true,
    },
    user_id: { type: Schema.Types.ObjectId, ref: "users", default: null, index: true },
    company_id: { type: Schema.Types.ObjectId, ref: "companies", default: null, index: true },
    active_context_id: { type: Schema.Types.ObjectId, ref: "account_contexts", default: null, index: true },
    context_type: { type: String, trim: true, default: "", index: true },
    entity_type: {
      type: String,
      enum: ["job", "application", "company", "campus", "university", "ai_request", "notification", "cv", "career_passport", "translation", "other"],
      default: "other",
      index: true,
    },
    entity_id: { type: Schema.Types.ObjectId, default: null, index: true },
    job_id: { type: Schema.Types.ObjectId, ref: "jobs", default: null, index: true },
    application_id: { type: Schema.Types.ObjectId, ref: "user_applying_job", default: null, index: true },
    session_id: { type: String, trim: true, default: "", index: true },
    platform: { type: String, trim: true, default: "" },
    app_version: { type: String, trim: true, default: "" },
    ip: { type: String, trim: true, default: "" },
    user_agent: { type: String, trim: true, default: "" },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { collection: "analytics_events", timestamps: true }
);

AnalyticsEventSchema.index({ event: 1, createdAt: -1 });
AnalyticsEventSchema.index({ group: 1, createdAt: -1 });
AnalyticsEventSchema.index({ user_id: 1, createdAt: -1 });
AnalyticsEventSchema.index({ company_id: 1, createdAt: -1 });
AnalyticsEventSchema.index({ context_type: 1, event: 1, createdAt: -1 });

const AnalyticsEventModel = mongoose.model("analytics_events", AnalyticsEventSchema);

export default AnalyticsEventModel;
