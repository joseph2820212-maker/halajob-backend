import mongoose from "mongoose";
const ExperienceLevelSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, lowercase: true, trim: true },
    title_ar: { type: String, required: true, trim: true },
    title_en: { type: String, required: true, trim: true },
    min_years: { type: Number, default: 0, min: 0 },
    max_years: { type: Number, default: null, min: 0 },
    keywords_ar: { type: [String], default: [] },
    keywords_en: { type: [String], default: [] },
    sort_order: { type: Number, default: 0 },
    is_active: { type: Boolean, default: true },
    is_system: { type: Boolean, default: true },
  },
  { collection: "experience_levels", timestamps: true }
);
ExperienceLevelSchema.index({ key: 1 }, { unique: true });
ExperienceLevelSchema.index({ is_active: 1, sort_order: 1 });
const ExperienceLevelModel = mongoose.model("experience_levels", ExperienceLevelSchema);
export default ExperienceLevelModel;
