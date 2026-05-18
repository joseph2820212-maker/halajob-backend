import mongoose from "mongoose";

const { Schema } = mongoose;

const NoteSchema = new Schema(
  {
    by_user_id: { type: Schema.Types.ObjectId, ref: "users", default: null },
    note: { type: String, trim: true, default: "" },
    type: {
      type: String,
      enum: ["company", "admin", "system"],
      default: "company",
    },
  },
  { _id: true, timestamps: true }
);

const JobZainTalentRequestSchema = new Schema(
  {
    company_id: {
      type: Schema.Types.ObjectId,
      ref: "companies",
      required: true,
      index: true,
    },
    requested_by_user_id: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: true,
      index: true,
    },
    job_id: {
      type: Schema.Types.ObjectId,
      ref: "jobs",
      default: null,
      index: true,
    },

    title: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },
    required_skills: { type: [String], default: [] },
    preferred_skills: { type: [String], default: [] },
    countries: { type: [String], default: [] },
    cities: { type: [String], default: [] },
    work_mode_id: { type: Schema.Types.ObjectId, ref: "work_modes", default: null, index: true },
    job_type_id: { type: Schema.Types.ObjectId, ref: "job_type", default: null, index: true },
    experience_level_id: { type: Schema.Types.ObjectId, ref: "experience_levels", default: null, index: true },
    education_level_id: { type: Schema.Types.ObjectId, ref: "education_levels", default: null, index: true },
    min_experience_years: { type: Number, default: 0, min: 0 },
    max_experience_years: { type: Number, default: null, min: 0 },
    salary_min: { type: Number, default: null, min: 0 },
    salary_max: { type: Number, default: null, min: 0 },
    currency_code: { type: String, trim: true, uppercase: true, default: "" },

    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
      index: true,
    },
    status: {
      type: String,
      enum: ["new", "in_progress", "candidates_sent", "closed", "cancelled"],
      default: "new",
      index: true,
    },

    requested_count: { type: Number, default: 5, min: 1, max: 100 },
    notes: { type: [NoteSchema], default: [] },
    admin_note: { type: String, trim: true, default: "" },
    closed_at: { type: Date, default: null },
  },
  { collection: "jobzain_talent_requests", timestamps: true }
);

JobZainTalentRequestSchema.index({ company_id: 1, createdAt: -1 });
JobZainTalentRequestSchema.index({ job_id: 1, status: 1 });
JobZainTalentRequestSchema.index({ status: 1, priority: 1, createdAt: -1 });

const JobZainTalentRequestModel = mongoose.model(
  "jobzain_talent_requests",
  JobZainTalentRequestSchema
);

export default JobZainTalentRequestModel;
