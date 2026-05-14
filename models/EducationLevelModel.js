import mongoose from "mongoose";
const EducationLevelSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, lowercase: true, trim: true },
    title_ar: { type: String, required: true, trim: true },
    title_en: { type: String, required: true, trim: true },
    sort_order: { type: Number, default: 0 },
    keywords_ar: { type: [String], default: [] },
    keywords_en: { type: [String], default: [] },
    is_active: { type: Boolean, default: true },
    is_system: { type: Boolean, default: true },
  },
  { collection: "education_levels", timestamps: true }
);
EducationLevelSchema.index({ key: 1 }, { unique: true });
EducationLevelSchema.index({ is_active: 1, sort_order: 1 });
const EducationLevelModel = mongoose.model("education_levels", EducationLevelSchema);
export default EducationLevelModel;
