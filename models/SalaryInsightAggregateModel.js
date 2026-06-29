import mongoose from "mongoose";

const { Schema } = mongoose;

const SalaryInsightAggregateSchema = new Schema(
  {
    key: { type: String, unique: true, index: true, required: true, trim: true },
    job_title_norm: { type: String, index: true, trim: true, default: "" },
    city_norm: { type: String, index: true, trim: true, default: "" },
    country_norm: { type: String, index: true, trim: true, default: "" },
    experience_level_id: {
      type: Schema.Types.ObjectId,
      ref: "experience_levels",
      default: null,
      index: true,
    },
    industry_id: {
      type: Schema.Types.ObjectId,
      ref: "industries",
      default: null,
      index: true,
    },
    currency_code: { type: String, default: "USD", uppercase: true, trim: true, index: true },
    sample_size: { type: Number, default: 0, min: 0 },
    min: { type: Number, default: null },
    p25: { type: Number, default: null },
    median: { type: Number, default: null },
    p75: { type: Number, default: null },
    max: { type: Number, default: null },
    min_usd: { type: Number, default: null },
    median_usd: { type: Number, default: null },
    max_usd: { type: Number, default: null },
    confidence: { type: String, enum: ["low", "medium", "high"], default: "low", index: true },
    generated_at: { type: Date, default: Date.now, index: true },
  },
  {
    collection: "salary_insight_aggregates",
    timestamps: true,
  },
);

SalaryInsightAggregateSchema.index({
  job_title_norm: 1,
  city_norm: 1,
  country_norm: 1,
  currency_code: 1,
});

const SalaryInsightAggregateModel = mongoose.model(
  "salary_insight_aggregates",
  SalaryInsightAggregateSchema,
);

export default SalaryInsightAggregateModel;
