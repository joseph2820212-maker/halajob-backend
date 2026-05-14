import mongoose from "mongoose";
const IndustrySchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, lowercase: true, trim: true },
    title_ar: { type: String, required: true, trim: true },
    title_en: { type: String, required: true, trim: true },
    keywords_ar: { type: [String], default: [] },
    keywords_en: { type: [String], default: [] },
    is_active: { type: Boolean, default: true },
    is_system: { type: Boolean, default: true },
  },
  { collection: "industries", timestamps: true }
);
IndustrySchema.index({ key: 1 }, { unique: true });
IndustrySchema.index({ title_ar: "text", title_en: "text", keywords_ar: "text", keywords_en: "text" });
const IndustryModel = mongoose.model("industries", IndustrySchema);
export default IndustryModel;
