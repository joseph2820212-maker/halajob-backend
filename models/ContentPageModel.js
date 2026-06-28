import mongoose from "mongoose";

const { Schema } = mongoose;

const Bilingual = { en: { type: String, default: "" }, ar: { type: String, default: "" } };

const ContentBlockSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["heading", "paragraph", "bullet_list", "numbered_list", "notice", "warning", "faq", "table", "contact_card", "cta", "legal_disclaimer"],
      default: "paragraph",
    },
    text: { type: Bilingual, default: () => ({}) },
    items: { type: [{ en: String, ar: String }], default: [] },
    severity: { type: String, enum: ["info", "warning", "legal", "danger", "success"], default: "info" },
    anchor: { type: String, trim: true, default: "" },
    sortOrder: { type: Number, default: 0 },
  },
  { _id: false }
);

const ContentPageSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, trim: true, index: true },
    category: { type: String, default: "legal", index: true }, // legal|privacy|trust|company|campus|help|public|billing
    audience: { type: [String], default: ["public"] },
    title: { type: Bilingual, default: () => ({}) },
    summary: { type: Bilingual, default: () => ({}) },
    contentBlocks: { type: [ContentBlockSchema], default: [] },
    seo: {
      title: { type: Bilingual, default: () => ({}) },
      description: { type: Bilingual, default: () => ({}) },
      noIndex: { type: Boolean, default: false },
    },
    status: { type: String, enum: ["draft", "review", "published", "archived"], default: "published", index: true },
    version: { type: String, default: "1.0" },
    effectiveAt: { type: Date, default: null },
    publishedAt: { type: Date, default: null },
    lastReviewedAt: { type: Date, default: null },
    requiresAcknowledgement: { type: Boolean, default: false },
    acknowledgementAudience: { type: [String], default: [] },
    legalReviewStatus: { type: String, enum: ["draft", "needs_lawyer_review", "lawyer_approved"], default: "needs_lawyer_review" },
    ownerDepartment: { type: String, default: "legal" }, // product|legal|support|privacy|trust
    createdBy: { type: Schema.Types.ObjectId, ref: "users", default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: "users", default: null },
  },
  { collection: "content_pages", timestamps: true }
);

ContentPageSchema.index({ category: 1, status: 1 });

const ContentPageModel = mongoose.model("content_pages", ContentPageSchema);
export default ContentPageModel;
