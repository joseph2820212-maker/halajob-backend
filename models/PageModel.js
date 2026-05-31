import mongoose from "mongoose";

const PageSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },

    image: { type: String },

    title_ar: { type: String },
    title_en: { type: String },

    description_ar: { type: String },
    description_en: { type: String },

    content: [
      {
        value_ar: { type: String },
        value_en: { type: String },
        type: {
          type: String,
          enum: ["title", "description"],
        },
      },
    ],

    status: { type: Boolean, default: true },
    is_ios: { type: Boolean, default: false },
  },
  {
    collection: "pages",
    strict: false,
    timestamps: true,
  }
);

PageSchema.index({ status: 1 });
PageSchema.index({ status: 1, createdAt: -1 });

const PageModel = mongoose.model("pages", PageSchema);

export default PageModel;