import mongoose from "mongoose";

const { Schema } = mongoose;
const Bilingual = { en: { type: String, default: "" }, ar: { type: String, default: "" } };

const HelpArticleSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, trim: true, index: true },
    categoryKey: { type: String, required: true, index: true },
    audience: { type: [String], default: ["public"] },
    title: { type: Bilingual, default: () => ({}) },
    summary: { type: Bilingual, default: () => ({}) },
    body: { type: Bilingual, default: () => ({}) },
    tags: { type: [String], default: [] },
    relatedArticleKeys: { type: [String], default: [] },
    relatedPolicyKeys: { type: [String], default: [] },
    contactCta: { enabled: { type: Boolean, default: false }, ticketType: { type: String, default: "" } },
    searchKeywords: { en: { type: [String], default: [] }, ar: { type: [String], default: [] } },
    status: { type: String, enum: ["draft", "published", "archived"], default: "published", index: true },
    version: { type: String, default: "1.0" },
    lastReviewedAt: { type: Date, default: null },
    helpfulCount: { type: Number, default: 0 },
    notHelpfulCount: { type: Number, default: 0 },
    sortOrder: { type: Number, default: 0 },
  },
  { collection: "help_articles", timestamps: true }
);

HelpArticleSchema.index({ categoryKey: 1, status: 1, sortOrder: 1 });

const HelpArticleModel = mongoose.model("help_articles", HelpArticleSchema);
export default HelpArticleModel;
