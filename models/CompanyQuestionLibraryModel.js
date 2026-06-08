import mongoose from "mongoose";

const { Schema } = mongoose;

const QuestionOptionSchema = new Schema(
  {
    label: { type: String, required: true, trim: true },
    value: { type: String, trim: true, default: "" },
    is_correct: { type: Boolean, default: false },
  },
  { _id: true }
);

const CompanyQuestionLibrarySchema = new Schema(
  {
    company_id: { type: Schema.Types.ObjectId, ref: "companies", required: true, index: true },
    created_by: { type: Schema.Types.ObjectId, ref: "users", default: null, index: true },
    title: { type: String, required: true, trim: true },
    question: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["text", "textarea", "yes_no", "single_choice", "multi_choice", "number", "file"],
      default: "text",
      index: true,
    },
    options: { type: [QuestionOptionSchema], default: [] },
    is_required: { type: Boolean, default: false },
    is_knockout: { type: Boolean, default: false, index: true },
    weight: { type: Number, default: 1, min: 0, max: 100 },
    expected_answer: { type: Schema.Types.Mixed, default: null },
    knockout_action: {
      type: String,
      enum: ["mark_not_match", "needs_manual_review", "reject"],
      default: "mark_not_match",
    },
    category: { type: String, trim: true, default: "general", index: true },
    tags: { type: [String], default: [], index: true },
    usage_count: { type: Number, default: 0, min: 0 },
    is_active: { type: Boolean, default: true, index: true },
  },
  { collection: "company_question_library", timestamps: true }
);

CompanyQuestionLibrarySchema.index({ company_id: 1, title: 1 });
CompanyQuestionLibrarySchema.index({ company_id: 1, is_active: 1, createdAt: -1 });

const CompanyQuestionLibraryModel = mongoose.model("company_question_library", CompanyQuestionLibrarySchema);
export default CompanyQuestionLibraryModel;
