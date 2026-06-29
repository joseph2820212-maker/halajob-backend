import mongoose from "mongoose";

const { Schema } = mongoose;

const LocalizedTextSchema = new Schema(
  {
    ar: { type: String, default: "", trim: true },
    en: { type: String, default: "", trim: true },
  },
  { _id: false }
);

const LearningResourceCollectionSchema = new Schema(
  {
    key: { type: String, unique: true, sparse: true, trim: true, lowercase: true, index: true },
    slug: { type: String, unique: true, sparse: true, trim: true, lowercase: true, index: true },
    title: { type: LocalizedTextSchema, default: () => ({}) },
    summary: { type: LocalizedTextSchema, default: () => ({}) },
    resource_ids: [{ type: Schema.Types.ObjectId, ref: "learning_resources", index: true }],
    audience: { type: [String], default: ["all"], index: true },
    visibility: { type: String, enum: ["public", "students", "university_private", "draft"], default: "public", index: true },
    status: { type: String, enum: ["draft", "published", "archived"], default: "draft", index: true },
    university_id: { type: Schema.Types.ObjectId, ref: "universities", default: null, index: true },
    sort_order: { type: Number, default: 0 },
  },
  { collection: "learning_resource_collections", timestamps: true }
);

const LearningResourceCollectionModel = mongoose.model(
  "learning_resource_collections",
  LearningResourceCollectionSchema
);

export default LearningResourceCollectionModel;
