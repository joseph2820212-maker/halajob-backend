import mongoose from "mongoose";

const { Schema } = mongoose;

const CompanyMessageTemplateSchema = new Schema(
  {
    company_id: { type: Schema.Types.ObjectId, ref: "companies", required: true, index: true },
    created_by: { type: Schema.Types.ObjectId, ref: "users", default: null },
    key: { type: String, required: true, trim: true, lowercase: true },
    title: { type: String, required: true, trim: true },
    type: { type: String, enum: ["acceptance", "rejection", "interview", "offer", "general"], default: "general", index: true },
    subject: { type: String, trim: true, default: "" },
    body: { type: String, required: true, trim: true },
    language: { type: String, enum: ["ar", "en"], default: "ar", index: true },
    is_active: { type: Boolean, default: true, index: true },
  },
  { collection: "company_message_templates", timestamps: true }
);

CompanyMessageTemplateSchema.index({ company_id: 1, key: 1, language: 1 }, { unique: true });
CompanyMessageTemplateSchema.index({ company_id: 1, type: 1, is_active: 1 });

const CompanyMessageTemplateModel = mongoose.model("company_message_templates", CompanyMessageTemplateSchema);
export default CompanyMessageTemplateModel;
