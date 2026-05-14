import mongoose from "mongoose";
const SkillSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, lowercase: true, trim: true },
    title_ar: { type: String, required: true, trim: true },
    title_en: { type: String, required: true, trim: true },
    category: { type: String, default: "general", trim: true, index: true },
    keywords_ar: { type: [String], default: [] },
    keywords_en: { type: [String], default: [] },
    is_active: { type: Boolean, default: true, index: true },
    is_system: { type: Boolean, default: true },
  },
  { collection: "skills", timestamps: true }
);
SkillSchema.index({ key: 1 }, { unique: true });
SkillSchema.index({ title_ar: "text", title_en: "text", keywords_ar: "text", keywords_en: "text" });
const SkillModel = mongoose.model("skills", SkillSchema);
export default SkillModel;
