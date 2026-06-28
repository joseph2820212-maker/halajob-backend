import mongoose from "mongoose";

const { Schema } = mongoose;
const Bilingual = { en: { type: String, default: "" }, ar: { type: String, default: "" } };

const FaqItemSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, trim: true, index: true },
    audience: { type: [String], default: ["public"] },
    category: { type: String, default: "public", index: true },
    question: { type: Bilingual, default: () => ({}) },
    answer: { type: Bilingual, default: () => ({}) },
    relatedLinks: { type: [{ label: { en: String, ar: String }, target: String }], default: [] },
    sortOrder: { type: Number, default: 0 },
    status: { type: String, enum: ["draft", "published", "archived"], default: "published", index: true },
  },
  { collection: "faq_items", timestamps: true }
);

FaqItemSchema.index({ category: 1, status: 1, sortOrder: 1 });

const FaqItemModel = mongoose.model("faq_items", FaqItemSchema);
export default FaqItemModel;
