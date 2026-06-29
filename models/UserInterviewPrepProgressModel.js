import mongoose from "mongoose";

const { Schema } = mongoose;

const UserInterviewPrepProgressSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: true,
      index: true,
    },
    question_id: {
      type: Schema.Types.ObjectId,
      ref: "interview_prep_questions",
      default: null,
      index: true,
    },
    resource_id: {
      type: Schema.Types.ObjectId,
      ref: "learning_resources",
      default: null,
      index: true,
    },
    job_id: {
      type: Schema.Types.ObjectId,
      ref: "jobs",
      default: null,
      index: true,
    },
    saved: { type: Boolean, default: false, index: true },
    note: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: ["not_started", "in_progress", "completed"],
      default: "not_started",
      index: true,
    },
    progress_percent: { type: Number, min: 0, max: 100, default: 0 },
    completed_at: { type: Date, default: null },
    last_opened_at: { type: Date, default: null },
  },
  { collection: "user_interview_prep_progress", timestamps: true },
);

UserInterviewPrepProgressSchema.index(
  { user_id: 1, question_id: 1 },
  {
    unique: true,
    partialFilterExpression: { question_id: { $type: "objectId" } },
  },
);
UserInterviewPrepProgressSchema.index(
  { user_id: 1, resource_id: 1 },
  {
    unique: true,
    partialFilterExpression: { resource_id: { $type: "objectId" } },
  },
);

const UserInterviewPrepProgressModel = mongoose.model(
  "user_interview_prep_progress",
  UserInterviewPrepProgressSchema,
);

export default UserInterviewPrepProgressModel;
