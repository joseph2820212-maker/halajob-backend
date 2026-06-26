import mongoose from "mongoose";

const { Schema } = mongoose;

const ContentTranslationSchema = new Schema(
  {
    entity_type: {
      type: String,
      enum: ["job", "cv", "career_passport"],
      required: true,
      index: true,
    },
    entity_id: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    job_id: { type: Schema.Types.ObjectId, ref: "jobs", default: null, index: true },
    cv_id: { type: Schema.Types.ObjectId, ref: "employee_cvs", default: null, index: true },
    employee_id: { type: Schema.Types.ObjectId, ref: "employees", default: null, index: true },
    company_id: { type: Schema.Types.ObjectId, ref: "companies", default: null, index: true },
    user_id: { type: Schema.Types.ObjectId, ref: "users", default: null, index: true },

    source_language: {
      type: String,
      enum: ["ar", "en"],
      required: true,
      index: true,
    },
    target_language: {
      type: String,
      enum: ["ar", "en"],
      required: true,
      index: true,
    },

    original_text: { type: Schema.Types.Mixed, required: true },
    translated_text: { type: Schema.Types.Mixed, required: true },
    ai_request_id: { type: Schema.Types.ObjectId, ref: "ai_requests", default: null, index: true },

    approval_required: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ["draft", "pending_approval", "approved", "rejected"],
      default: "pending_approval",
      index: true,
    },
    approved_by: { type: Schema.Types.ObjectId, ref: "users", default: null },
    approved_at: { type: Date, default: null },
    rejected_by: { type: Schema.Types.ObjectId, ref: "users", default: null },
    rejected_at: { type: Date, default: null },
    rejection_reason: { type: String, trim: true, default: "" },

    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { collection: "content_translations", timestamps: true }
);

ContentTranslationSchema.index(
  { entity_type: 1, entity_id: 1, target_language: 1 },
  { unique: true }
);
ContentTranslationSchema.index({ status: 1, target_language: 1, updatedAt: -1 });
ContentTranslationSchema.index({ company_id: 1, entity_type: 1, updatedAt: -1 });
ContentTranslationSchema.index({ employee_id: 1, entity_type: 1, updatedAt: -1 });

const ContentTranslationModel = mongoose.model(
  "content_translations",
  ContentTranslationSchema
);

export default ContentTranslationModel;
