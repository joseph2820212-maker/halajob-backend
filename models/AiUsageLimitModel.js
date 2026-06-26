import mongoose from "mongoose";

const { Schema } = mongoose;

const AiUsageLimitSchema = new Schema(
  {
    feature: { type: String, required: true, trim: true, index: true },
    scope_type: {
      type: String,
      enum: ["global", "user", "context", "company", "university"],
      default: "global",
      index: true,
    },
    scope_id: { type: String, trim: true, default: "global", index: true },
    enabled: { type: Boolean, default: false },
    daily_limit: { type: Number, min: 0, default: 0 },
    monthly_limit: { type: Number, min: 0, default: 0 },
    provider: { type: String, trim: true, default: "" },
    model: { type: String, trim: true, default: "" },
    is_active: { type: Boolean, default: true, index: true },
    note: { type: String, trim: true, default: "" },
  },
  { collection: "ai_usage_limits", timestamps: true }
);

AiUsageLimitSchema.index({ feature: 1, scope_type: 1, scope_id: 1 }, { unique: true });
AiUsageLimitSchema.index({ feature: 1, is_active: 1 });

const AiUsageLimitModel = mongoose.model("ai_usage_limits", AiUsageLimitSchema);
export default AiUsageLimitModel;
