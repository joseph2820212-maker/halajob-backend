import mongoose from "mongoose";

const { Schema } = mongoose;

const ScoreComponentSchema = new Schema(
  {
    key: { type: String, trim: true, required: true },
    label: { type: String, trim: true, required: true },
    weight: { type: Number, required: true, min: 0, max: 100 },
    score: { type: Number, required: true, min: 0, max: 100 },
    explanation: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const CareerPassportSchema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "users", required: true, unique: true, index: true },
    employee_id: { type: Schema.Types.ObjectId, ref: "employees", required: true, index: true },
    active_context_id: { type: Schema.Types.ObjectId, ref: "account_contexts", default: null, index: true },
    visibility: {
      type: String,
      enum: ["private", "companies_only", "public"],
      default: "private",
      index: true,
    },
    share: {
      enabled: { type: Boolean, default: false, index: true },
      token: { type: String, trim: true, default: "", index: true },
      created_at: { type: Date, default: null },
      revoked_at: { type: Date, default: null },
      expires_at: { type: Date, default: null },
    },
    score: {
      total: { type: Number, default: 0, min: 0, max: 100, index: true },
      source: { type: String, trim: true, default: "rule_based_v1" },
      generated_by_ai: { type: Boolean, default: false },
      explanation: { type: String, trim: true, default: "" },
      components: { type: [ScoreComponentSchema], default: [] },
      strengths: { type: [String], default: [] },
      next_actions: { type: [String], default: [] },
      updated_at: { type: Date, default: null },
    },
    snapshot: { type: Schema.Types.Mixed, default: {} },
  },
  { collection: "career_passports", timestamps: true }
);

CareerPassportSchema.index({ employee_id: 1 });
CareerPassportSchema.index({ "share.token": 1 }, { sparse: true });

const CareerPassportModel = mongoose.model("career_passports", CareerPassportSchema);

export default CareerPassportModel;
