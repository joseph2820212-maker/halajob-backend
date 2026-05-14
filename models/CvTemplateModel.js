import mongoose from "mongoose";

const CvTemplateSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    title_ar: { type: String, required: true, trim: true },
    title_en: { type: String, required: true, trim: true },

    description_ar: { type: String, default: "", trim: true },
    description_en: { type: String, default: "", trim: true },

    preview_image: { type: String, default: "" },

    html: { type: String, required: true },
    css: { type: String, default: "" },

    default_colors: {
      background_color: { type: String, default: "#f0ebe3" },
      card_color: { type: String, default: "#ffffff" },
      sidebar_color: { type: String, default: "#2b2d42" },
      accent_color: { type: String, default: "#ef8354" },
      text_color: { type: String, default: "#555555" },
    },

    default_font: {
      family: { type: String, default: "Arial" },
      size: { type: Number, default: 14 },
    },

    supported_languages: {
      type: [String],
      enum: ["ar", "en"],
      default: ["ar", "en"],
    },

    is_active: { type: Boolean, default: true, index: true },
    is_system: { type: Boolean, default: true },
    sort_order: { type: Number, default: 0 },
  },
  { collection: "cv_templates", timestamps: true }
);

CvTemplateSchema.index({ is_active: 1, sort_order: 1 });

const CvTemplateModel = mongoose.model("cv_templates", CvTemplateSchema);

export default CvTemplateModel;