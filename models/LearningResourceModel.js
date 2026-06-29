import mongoose from "mongoose";

const { Schema } = mongoose;

const LocalizedTextSchema = new Schema(
  {
    ar: { type: String, default: "", trim: true },
    en: { type: String, default: "", trim: true },
  },
  { _id: false }
);

const LearningResourceSchema = new Schema(
  {
    key: { type: String, unique: true, sparse: true, trim: true, lowercase: true, index: true },
    slug: { type: String, unique: true, sparse: true, trim: true, lowercase: true, index: true },
    type: {
      type: String,
      enum: ["article", "video", "template", "checklist", "course", "guide", "interview_questions", "career_path"],
      required: true,
      index: true,
    },
    audience: {
      type: [String],
      enum: ["all", "students", "fresh_graduates", "job_seekers", "universities", "companies"],
      default: ["all"],
      index: true,
    },
    title: { type: LocalizedTextSchema, default: () => ({}) },
    summary: { type: LocalizedTextSchema, default: () => ({}) },
    body: { type: LocalizedTextSchema, default: () => ({}) },
    category_ids: [{ type: Schema.Types.ObjectId, ref: "learning_resource_categories", index: true }],
    tags: { type: [String], default: [], index: true },
    language: { type: String, enum: ["ar", "en", "both"], default: "both" },
    media_url: { type: String, default: "", trim: true },
    file_url: { type: String, default: "", trim: true },
    cover_image: { type: String, default: "", trim: true },
    estimated_minutes: { type: Number, default: 5, min: 1 },
    difficulty: { type: String, enum: ["beginner", "intermediate", "advanced"], default: "beginner" },
    source_type: { type: String, enum: ["platform", "university", "company"], default: "platform", index: true },
    university_id: { type: Schema.Types.ObjectId, ref: "universities", default: null, index: true },
    company_id: { type: Schema.Types.ObjectId, ref: "companies", default: null, index: true },
    visibility: { type: String, enum: ["public", "students", "university_private", "draft"], default: "public", index: true },
    status: { type: String, enum: ["draft", "published", "archived"], default: "draft", index: true },
    featured: { type: Boolean, default: false, index: true },
    sort_order: { type: Number, default: 0 },
    published_at: { type: Date, default: null },
    created_by: { type: Schema.Types.ObjectId, ref: "users", default: null },
    updated_by: { type: Schema.Types.ObjectId, ref: "users", default: null },
  },
  { collection: "learning_resources", timestamps: true }
);

LearningResourceSchema.index({ status: 1, visibility: 1, featured: -1, sort_order: 1, published_at: -1 });
LearningResourceSchema.index({ tags: 1, type: 1, audience: 1 });

const LearningResourceModel = mongoose.model("learning_resources", LearningResourceSchema);

export default LearningResourceModel;
