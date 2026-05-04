import mongoose from "mongoose";

const JopNameSchema = new mongoose.Schema({
  sheet: { type: mongoose.Schema.Types.ObjectId, ref: "Sheet", index: true, required: true },

  sector_ar: { type: String, trim: true },
  sector_en: { type: String, trim: true },
  subsector_ar: { type: String, trim: true },
  subsector_en: { type: String, trim: true },
  title_ar: { type: String, trim: true },
  title_en: { type: String, trim: true },

  // طابق الكنترولر: "keywords"
  keywords: { type: [String], default: [] },

  is_auto: { type: Boolean, default: true },

  // مفتاح إزالة التكرار
  dedupeKey: { type: String, required: true, index: true, trim: true },
}, { collection: "job_name", timestamps: true });

// الفهرس الوحيد المطلوب
JopNameSchema.index({ sheet: 1, dedupeKey: 1 }, { unique: true });

// لا داعي لفهرس فريد آخر
const JopNameModel = mongoose.model("JobName", JopNameSchema);
export default JopNameModel;
