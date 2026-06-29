import mongoose from "mongoose";

const { Schema } = mongoose;

const LocalizedTextSchema = new Schema(
  {
    ar: { type: String, default: "", trim: true },
    en: { type: String, default: "", trim: true },
  },
  { _id: false },
);

const InterviewPrepQuestionSchema = new Schema(
  {
    title: { type: LocalizedTextSchema, default: () => ({}) },
    question: { type: LocalizedTextSchema, required: true },
    answer_tips: { type: LocalizedTextSchema, default: () => ({}) },
    category: { type: String, trim: true, default: "general", index: true },
    job_name_id: {
      type: Schema.Types.ObjectId,
      ref: "job_name",
      default: null,
      index: true,
    },
    industry_id: {
      type: Schema.Types.ObjectId,
      ref: "industries",
      default: null,
      index: true,
    },
    audience: {
      type: [String],
      default: ["job_seekers"],
      index: true,
    },
    difficulty: {
      type: String,
      enum: ["basic", "medium", "advanced"],
      default: "basic",
      index: true,
    },
    tags: { type: [String], default: [], index: true },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "published",
      index: true,
    },
    created_by: { type: Schema.Types.ObjectId, ref: "users", default: null },
    updated_by: { type: Schema.Types.ObjectId, ref: "users", default: null },
  },
  { collection: "interview_prep_questions", timestamps: true },
);

InterviewPrepQuestionSchema.index({
  status: 1,
  category: 1,
  difficulty: 1,
  createdAt: -1,
});
InterviewPrepQuestionSchema.index({ tags: 1, audience: 1 });

const InterviewPrepQuestionModel = mongoose.model(
  "interview_prep_questions",
  InterviewPrepQuestionSchema,
);

export default InterviewPrepQuestionModel;
