import mongoose from "mongoose";

const normalizeText = (value = "") =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");

const JopNameSchema = new mongoose.Schema(
  {
    sheet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "sheet",
      index: true,
      default: null,
    },

    sector_ar: { type: String, trim: true, default: "" },
    sector_en: { type: String, trim: true, default: "" },
    subSector_ar: { type: String, trim: true, default: "" },
    subSector_en: { type: String, trim: true, default: "" },
    title_ar: { type: String, trim: true, default: "" },
    title_en: { type: String, trim: true, default: "" },

    keywords: { type: [String], default: [] },

    is_auto: { type: Boolean, default: true },

    dedupeKey: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
  },
  { collection: "job_name", timestamps: true }
);

JopNameSchema.pre("validate", function (next) {
  if (!this.dedupeKey) {
    this.dedupeKey = normalizeText(this.title_en || this.title_ar || this.keywords?.[0] || "");
  }

  if (!this.title_ar && this.title_en) this.title_ar = this.title_en;
  if (!this.title_en && this.title_ar) this.title_en = this.title_ar;

  next();
});

JopNameSchema.index({ sheet: 1, dedupeKey: 1 }, { unique: true });

const JopNameModel = mongoose.model("job_name", JopNameSchema);
export default JopNameModel;