import mongoose from "mongoose";

const WorkModeSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    title_ar: {
      type: String,
      required: true,
      trim: true,
    },

    title_en: {
      type: String,
      required: true,
      trim: true,
    },

    keywords_ar: {
      type: [String],
      default: [],
    },

    keywords_en: {
      type: [String],
      default: [],
    },

    icon: {
      type: String,
      default: "",
    },

    sort_order: {
      type: Number,
      default: 0,
    },

    is_active: {
      type: Boolean,
      default: true,
    },

    is_system: {
      type: Boolean,
      default: true,
    },
  },
  {
    collection: "work_modes",
    timestamps: true,
  }
);

WorkModeSchema.index({ key: 1 }, { unique: true });
WorkModeSchema.index({ is_active: 1, sort_order: 1 });

const WorkModeModel = mongoose.model(
  "work_modes",
  WorkModeSchema
);

export default WorkModeModel;