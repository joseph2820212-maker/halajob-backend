import mongoose from "mongoose";

const { Schema } = mongoose;

const LocalizedTextSchema = new Schema(
  {
    ar: { type: String, default: "", trim: true },
    en: { type: String, default: "", trim: true },
  },
  { _id: false }
);

const LearningResourceCategorySchema = new Schema(
  {
    key: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
    slug: { type: String, unique: true, sparse: true, trim: true, lowercase: true, index: true },
    title: { type: LocalizedTextSchema, default: () => ({}) },
    description: { type: LocalizedTextSchema, default: () => ({}) },
    icon: { type: String, default: "", trim: true },
    sort_order: { type: Number, default: 0 },
    status: { type: String, enum: ["active", "archived"], default: "active", index: true },
  },
  { collection: "learning_resource_categories", timestamps: true }
);

const LearningResourceCategoryModel = mongoose.model(
  "learning_resource_categories",
  LearningResourceCategorySchema
);

export default LearningResourceCategoryModel;
