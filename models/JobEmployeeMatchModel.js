import mongoose from "mongoose";

const { Schema } = mongoose;

const JobEmployeeMatchSchema = new Schema(
  {
    job_id: { type: Schema.Types.ObjectId, ref: "jobs", required: true, index: true },
    employee_id: { type: Schema.Types.ObjectId, ref: "employees", required: true, index: true },
    company_id: { type: Schema.Types.ObjectId, ref: "companies", required: true, index: true },
    user_id: { type: Schema.Types.ObjectId, ref: "users", default: null, index: true },

    score: { type: Number, default: 0, min: 0, max: 100, index: true },

    breakdown: {
      skills: { type: Number, default: 0 },
      experience: { type: Number, default: 0 },
      location: { type: Number, default: 0 },
      salary: { type: Number, default: 0 },
      work_mode: { type: Number, default: 0 },
      language: { type: Number, default: 0 },
    },

    matched_skills: { type: [String], default: [] },
    missing_skills: { type: [String], default: [] },
    matched_languages: { type: [String], default: [] },
    missing_languages: { type: [String], default: [] },

    is_recommended_to_employee: { type: Boolean, default: true, index: true },
    is_recommended_to_company: { type: Boolean, default: true, index: true },

    algorithm_version: { type: String, default: "projection-matching-v1" },
    generated_at: { type: Date, default: Date.now, index: true },
  },
  { collection: "job_employee_matches", timestamps: true }
);

JobEmployeeMatchSchema.index({ job_id: 1, employee_id: 1 }, { unique: true });
JobEmployeeMatchSchema.index({ employee_id: 1, score: -1, generated_at: -1 });
JobEmployeeMatchSchema.index({ user_id: 1, score: -1, generated_at: -1 });
JobEmployeeMatchSchema.index({ job_id: 1, score: -1, generated_at: -1 });
JobEmployeeMatchSchema.index({ company_id: 1, score: -1, generated_at: -1 });

const JobEmployeeMatchModel = mongoose.model("job_employee_matches", JobEmployeeMatchSchema);
export default JobEmployeeMatchModel;
