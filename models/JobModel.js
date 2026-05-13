import mongoose from "mongoose";

const { Schema } = mongoose;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

const JobQuestionSchema = new Schema(
  {
    question: { type: String, required: true, trim: true },
    type: { type: String, enum: ["text", "textarea", "yes_no", "single_choice", "multi_choice", "number", "file"], default: "text" },
    options: { type: [String], default: [] },
    is_required: { type: Boolean, default: false },
  },
  { _id: true }
);

const SkillRequirementSchema = new Schema(
  {
    skill_id: { type: Schema.Types.ObjectId, ref: "skills", default: null },
    title: { type: String, required: true, trim: true },
    level: { type: Number, min: 1, max: 5, default: 3 },
    years: { type: Number, min: 0, default: 0 },
  },
  { _id: false }
);

const JobServiceSnapshotSchema = new Schema(
  {
    service_id: { type: Schema.Types.ObjectId, ref: "job_service", default: null },
    name: { type: String, trim: true },
    title_ar: { type: String, trim: true },
    title_en: { type: String, trim: true },
  },
  { _id: false }
);

const JobsSchema = new Schema(
  {
    search_index: {
      title_norm: { type: String, default: "" },
      description_norm: { type: String, default: "" },
      text_norm: { type: String, default: "" },
      tokens: { type: [String], default: [] },
      phrases: { type: [String], default: [] },
      aliases: { type: [String], default: [] },
      title_tokens: { type: [String], default: [] },
      skill_tokens: { type: [String], default: [] },
      company_tokens: { type: [String], default: [] },
      service_tokens: { type: [String], default: [] },
      country_tokens: { type: [String], default: [] },
      sector_tokens: { type: [String], default: [] },
      filters: {
        countries: { type: [String], default: [] },
        job_type: { type: String, default: "" },
        work_time: { type: String, default: "" },
        work_mode: { type: String, default: "" },
        salary_type: { type: String, default: "" },
        currency: { type: String, default: "" },
        candidate_target: { type: [String], default: [] },
        experience_level: { type: String, default: "" },
        education_level: { type: String, default: "" },
        is_remote: { type: Boolean, default: false },
        languages: { type: [String], default: [] },
      },
      score_signals: {
        rating: { type: Number, default: 0 },
        views: { type: Number, default: 0 },
        saves: { type: Number, default: 0 },
        applies: { type: Number, default: 0 },
        reviews: { type: Number, default: 0 },
      },
    },

    job_name: { type: String, required: true, trim: true },
    job_name_id: { type: Schema.Types.ObjectId, ref: "job_name", default: null },
    description: { type: String, required: true, trim: true },
    ref: { type: String, trim: true, index: true },
    job_keywords: { type: [String], default: [] },
    keywords_norm: { type: [String], default: [] },
    phrases_norm: { type: [String], default: [] },

    status: { type: Boolean, default: false, index: true },
    is_accepted: { type: Boolean, default: false, index: true },
    publish_status: { type: String, enum: ["draft", "pending_review", "published", "paused", "closed", "rejected", "archived"], default: "draft", index: true },
    started_date: { type: Date, default: null },
    end_date: { type: Date, default: null },
    apply_deadline: { type: Date, default: null, index: true },
    is_update: { type: Boolean, default: false },
    vacancies_count: { type: Number, default: 1, min: 1 },
    priority: { type: Number, default: 0, min: 0 },

    countries: { type: [String], required: true, default: [] },
    city: { type: String, default: "", trim: true },
    address: { type: String, default: "", trim: true },

    work_mode_id: { type: Schema.Types.ObjectId, ref: "work_modes", required: true },
    work_mode_info: { type: Schema.Types.Mixed, default: {} },
    is_remote: { type: Boolean, default: false },

    job_type_id: { type: Schema.Types.ObjectId, ref: "job_type", required: true },
    job_type_info: { type: Schema.Types.Mixed, default: {} },
    job_time_id: { type: Schema.Types.ObjectId, ref: "work_time", required: true },
    job_time_info: { type: Schema.Types.Mixed, default: {} },
    job_salary_id: { type: Schema.Types.ObjectId, ref: "job_salary", required: true },
    job_salary_info: { type: Schema.Types.Mixed, default: {} },

    experience_level_id: { type: Schema.Types.ObjectId, ref: "experience_levels", default: null, index: true },
    experience_level_info: { type: Schema.Types.Mixed, default: {} },
    min_experience_years: { type: Number, default: 0, min: 0 },
    max_experience_years: { type: Number, default: null, min: 0 },
    education_level_id: { type: Schema.Types.ObjectId, ref: "education_levels", default: null, index: true },
    education_level_info: { type: Schema.Types.Mixed, default: {} },

    candidate_target: { type: [String], enum: ["students", "graduates", "fresh_graduates", "experienced", "career_changers", "all"], default: ["all"], index: true },
    is_for_students: { type: Boolean, default: false, index: true },
    is_for_graduates: { type: Boolean, default: false, index: true },
    is_for_fresh_graduates: { type: Boolean, default: false, index: true },

    skills_required: { type: [SkillRequirementSchema], default: [] },
    skills_optional: { type: [SkillRequirementSchema], default: [] },
    languages: [{ language_id: { type: Schema.Types.ObjectId, ref: "languages", default: null }, name: { type: String, trim: true }, level: { type: Number, min: 1, max: 5 } }],

    salary: {
      min: { type: Number, default: null, min: 0 },
      max: { type: Number, default: null, min: 0 },
      currency_id: { type: Schema.Types.ObjectId, ref: "currencies", required: true },
      currency_code: { type: String, required: true, uppercase: true, trim: true },
      currency_rate_snapshot: { type: Number, required: true, min: 0, default: 1 },
      min_usd: { type: Number, default: null, min: 0 },
      max_usd: { type: Number, default: null, min: 0 },
      is_visible: { type: Boolean, default: true },
      is_negotiable: { type: Boolean, default: false },
    },

    job_services: { type: [JobServiceSnapshotSchema], default: [] },

    show_company_information: { type: Boolean, default: true },
    is_send_emails: { type: Boolean, default: false },
    is_cv_required: { type: Boolean, default: true },
    is_contact_on_emails: { type: Boolean, default: false },
    emails: {
      type: [String],
      validate: [{ validator(v) { return this.is_send_emails ? Array.isArray(v) && v.length > 0 && v.every((e) => emailRegex.test(e)) : !v || v.every((e) => emailRegex.test(e)); }, message: "invalid or missing emails when is_send_emails=true" }],
      default: undefined,
    },

    is_out_side: { type: Boolean, default: false },
    out_link: {
      type: String,
      trim: true,
      default: "",
      validate: [{ validator(v) { if (this.is_out_side) { try { new URL(v); return true; } catch { return false; } } return v == null || v === ""; }, message: "out_link is required and must be a valid URL when is_out_side=true" }],
    },

    user_show: { type: Number, default: 0, min: 0 },
    user_review: { type: Number, default: 0, min: 0 },
    user_applying: { type: Number, default: 0, min: 0 },
    out_side_applying: { type: Number, default: 0, min: 0 },
    user_saved: { type: Number, default: 0, min: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },

    questions: { type: [JobQuestionSchema], validate: [{ validator: (v) => !v || v.length <= 5, message: "questions max length is 5" }], default: [] },
    company_id: { type: Schema.Types.ObjectId, ref: "companies", required: true, index: true },
    user_id: { type: Schema.Types.ObjectId, ref: "users", required: true, index: true },
  },
  { collection: "jobs", timestamps: true }
);

JobsSchema.pre("validate", function (next) {
  if (this.salary?.min != null && this.salary?.max != null && this.salary.min > this.salary.max) return next(new Error("salary.min cannot be greater than salary.max"));
  if (this.min_experience_years != null && this.max_experience_years != null && this.min_experience_years > this.max_experience_years) return next(new Error("min_experience_years cannot be greater than max_experience_years"));
  if (this.salary && this.salary.currency_rate_snapshot > 0) {
    if (this.salary.min != null) this.salary.min_usd = this.salary.min / this.salary.currency_rate_snapshot;
    if (this.salary.max != null) this.salary.max_usd = this.salary.max / this.salary.currency_rate_snapshot;
  }
  const targets = this.candidate_target || [];
  this.is_for_students = targets.includes("students");
  this.is_for_graduates = targets.includes("graduates");
  this.is_for_fresh_graduates = targets.includes("fresh_graduates");
  next();
});

JobsSchema.index({ status: 1, is_accepted: 1, publish_status: 1, createdAt: -1 });
JobsSchema.index({ company_id: 1, status: 1, is_accepted: 1 });
JobsSchema.index({ countries: 1, status: 1, is_accepted: 1, createdAt: -1 });
JobsSchema.index({ candidate_target: 1, createdAt: -1 });
JobsSchema.index({ job_type_id: 1, createdAt: -1 });
JobsSchema.index({ work_mode_id: 1, createdAt: -1 });
JobsSchema.index({ job_time_id: 1, createdAt: -1 });
JobsSchema.index({ job_salary_id: 1, createdAt: -1 });
JobsSchema.index({ experience_level_id: 1, createdAt: -1 });
JobsSchema.index({ education_level_id: 1, createdAt: -1 });
JobsSchema.index({ "skills_required.skill_id": 1 });
JobsSchema.index({ "salary.currency_code": 1 });
JobsSchema.index({ "salary.min_usd": 1 });
JobsSchema.index({ "salary.max_usd": 1 });
JobsSchema.index({ keywords_norm: 1 });
JobsSchema.index({ phrases_norm: 1 });
JobsSchema.index({ "search_index.tokens": 1 });
JobsSchema.index({ "search_index.phrases": 1 });
JobsSchema.index({ "search_index.aliases": 1 });
JobsSchema.index({ "search_index.filters.countries": 1 });
JobsSchema.index({ "search_index.filters.job_type": 1 });
JobsSchema.index({ "search_index.filters.work_time": 1 });
JobsSchema.index({ "search_index.filters.work_mode": 1 });
JobsSchema.index({ "search_index.filters.salary_type": 1 });
JobsSchema.index({ "search_index.filters.currency": 1 });
JobsSchema.index({ "search_index.filters.candidate_target": 1 });
JobsSchema.index({ "search_index.filters.is_remote": 1 });
JobsSchema.index({ "search_index.title_norm": "text", "search_index.text_norm": "text" });
JobsSchema.index({ job_name: "text", description: "text" });

const jobsModel = mongoose.model("jobs", JobsSchema);
export default jobsModel;
