import mongoose from "mongoose";

const { Schema } = mongoose;

const AiRequestSchema = new Schema(
  {
    feature: { type: String, required: true, trim: true, index: true },
    input_hash: { type: String, required: true, trim: true, index: true },
    input_summary: { type: Schema.Types.Mixed, default: {} },
    output_json: { type: Schema.Types.Mixed, default: null },
    provider: { type: String, trim: true, default: "" },
    model: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: ["queued", "processing", "completed", "failed", "blocked", "cached"],
      default: "queued",
      index: true,
    },
    error: { type: String, trim: true, default: "" },
    token_estimate: { type: Number, min: 0, default: 0 },
    cost_estimate: { type: Number, min: 0, default: 0 },
    user_id: { type: Schema.Types.ObjectId, ref: "users", default: null, index: true },
    active_context_id: { type: String, trim: true, default: "", index: true },
    active_context_type: { type: String, trim: true, default: "", index: true },
    company_id: { type: Schema.Types.ObjectId, ref: "companies", default: null, index: true },
    employee_id: { type: Schema.Types.ObjectId, ref: "employees", default: null, index: true },
    job_id: { type: Schema.Types.ObjectId, ref: "jobs", default: null, index: true },
    request_ip: { type: String, trim: true, default: "" },
    user_agent: { type: String, trim: true, default: "" },
    safety: {
      suggestion_only: { type: Boolean, default: true },
      human_approval_required: { type: Boolean, default: true },
      auto_action_performed: { type: Boolean, default: false },
    },
  },
  { collection: "ai_requests", timestamps: true }
);

AiRequestSchema.index({ feature: 1, user_id: 1, input_hash: 1, status: 1, createdAt: -1 });
AiRequestSchema.index({ feature: 1, active_context_id: 1, createdAt: -1 });
AiRequestSchema.index({ user_id: 1, createdAt: -1 });

const AiRequestModel = mongoose.model("ai_requests", AiRequestSchema);
export default AiRequestModel;
