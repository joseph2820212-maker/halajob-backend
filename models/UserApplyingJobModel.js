import mongoose from "mongoose";
const { Schema } = mongoose;

const ApplicationAnswerSchema = new Schema({ question_id: { type: Schema.Types.ObjectId, default: null }, question: { type: String, trim: true }, answer: Schema.Types.Mixed }, { _id: false });

const UserApplyingJobSchema = new Schema(
  {
    status: { type: String, default: "waiting", enum: ["waiting", "screening", "shortlisted", "interview", "offer", "accepted", "hired", "rejected", "withdrawn", "auto_cancel"], index: true },
    status_changed_at: { type: Date, default: null },
    user_id: { type: Schema.Types.ObjectId, ref: "users", required: true, index: true },
    employee_id: { type: Schema.Types.ObjectId, ref: "employees", default: null, index: true },
    job_id: { type: Schema.Types.ObjectId, ref: "jobs", required: true, index: true },
    company_id: { type: Schema.Types.ObjectId, ref: "companies", required: true, index: true },
    first_name: { type: String, required: true, trim: true },
    last_name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone_code: { type: String, required: true, trim: true },
    phone_national: { type: String, required: true, trim: true },
    country_id: { type: Schema.Types.ObjectId, ref: "Country", required: true },
    answers: { type: [ApplicationAnswerSchema], default: [] },
    cv: { type: String, default: "" },
    cover_letter: { type: String, default: "" },
    user_job_rating: { type: Number, default: 0, min: 0, max: 5 },
    is_collect_rating: { type: Boolean, default: false },
    cv_download: { type: Boolean, default: false },
    is_filter: { type: Boolean, default: false },
    filter_on: { type: Boolean, default: false },
    filter_result: { score: { type: Number, default: null }, matched_skills: { type: [String], default: [] }, missing_skills: { type: [String], default: [] }, reason: { type: String, default: "" } },
    source: { type: String, enum: ["app", "web", "external", "invitation"], default: "app" },
    last_activity_at: { type: Date, default: Date.now },
  },
  { collection: "user_applying_job", timestamps: true }
);
UserApplyingJobSchema.index({ user_id: 1, job_id: 1 }, { unique: true });
UserApplyingJobSchema.index({ job_id: 1, status: 1, createdAt: -1 });
UserApplyingJobSchema.index({ company_id: 1, status: 1, createdAt: -1 });
const UserApplyingJobModel = mongoose.model("user_applying_job", UserApplyingJobSchema);
export default UserApplyingJobModel;
