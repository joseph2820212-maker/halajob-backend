import mongoose from "mongoose";
const { Schema } = mongoose;
const JobMatchSchema = new Schema(
  {
    job_id: { type: Schema.Types.ObjectId, ref: "jobs", required: true, index: true },
    employee_id: { type: Schema.Types.ObjectId, ref: "employees", required: true, index: true },
    user_id: { type: Schema.Types.ObjectId, ref: "users", required: true, index: true },
    score: { type: Number, required: true, min: 0, max: 100, index: true },
    matched_skills: { type: [String], default: [] },
    missing_skills: { type: [String], default: [] },
    matched_reasons: { type: [String], default: [] },
    warnings: { type: [String], default: [] },
    algorithm_version: { type: String, default: "v1" },
    calculated_at: { type: Date, default: Date.now },
  },
  { collection: "job_matches", timestamps: true }
);
JobMatchSchema.index({ job_id: 1, employee_id: 1 }, { unique: true });
JobMatchSchema.index({ employee_id: 1, score: -1 });
JobMatchSchema.index({ job_id: 1, score: -1 });
const JobMatchModel = mongoose.model("job_matches", JobMatchSchema);
export default JobMatchModel;
