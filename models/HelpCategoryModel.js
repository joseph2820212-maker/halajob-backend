import mongoose from "mongoose";

const { Schema } = mongoose;
const Bilingual = { en: { type: String, default: "" }, ar: { type: String, default: "" } };

const HelpCategorySchema = new Schema(
  {
    key: { type: String, required: true, unique: true, trim: true, index: true },
    audience: { type: String, default: "public", index: true },
    title: { type: Bilingual, default: () => ({}) },
    description: { type: Bilingual, default: () => ({}) },
    icon: { type: String, default: "" },
    sortOrder: { type: Number, default: 0 },
    status: { type: String, enum: ["draft", "published", "archived"], default: "published", index: true },
  },
  { collection: "help_categories", timestamps: true }
);

const HelpCategoryModel = mongoose.model("help_categories", HelpCategorySchema);
export default HelpCategoryModel;
