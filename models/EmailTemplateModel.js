import mongoose from "mongoose";

const { Schema } = mongoose;
const Bilingual = { en: { type: String, default: "" }, ar: { type: String, default: "" } };

const EmailTemplateSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, trim: true, index: true },
    category: { type: String, default: "account", index: true }, // account|seeker|company|campus|privacy|billing
    subject: { type: Bilingual, default: () => ({}) },
    preheader: { type: Bilingual, default: () => ({}) },
    bodyBlocks: { type: [{ type: { type: String }, text: { en: String, ar: String } }], default: [] },
    variables: { type: [String], default: [] },
    fromName: { type: String, default: "Hala Job" },
    replyTo: { type: String, default: "" },
    isMarketing: { type: Boolean, default: false }, // marketing/job-alert templates require an unsubscribe link
    status: { type: String, enum: ["draft", "review", "published", "archived"], default: "published", index: true },
    version: { type: String, default: "1.0" },
    lastReviewedAt: { type: Date, default: null },
  },
  { collection: "email_templates", timestamps: true }
);

const EmailTemplateModel = mongoose.model("email_templates", EmailTemplateSchema);
export default EmailTemplateModel;
