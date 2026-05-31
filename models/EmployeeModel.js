import mongoose from "mongoose";

const { Schema } = mongoose;

const ExperienceSchema = new Schema(
  {
    company_name: { type: String, trim: true, default: "" },
    position: { type: String, trim: true, default: "" },
    start_date: { type: Date, default: null },
    end_date: { type: Date, default: null },
    is_until_now: { type: Boolean, default: false },
    details: { type: String, trim: true, default: "" },
  },
  { _id: true, timestamps: true }
);

const EducationSchema = new Schema(
  {
    education_level_id: {
      type: Schema.Types.ObjectId,
      ref: "education_levels",
      default: null,
      index: true,
    },
    level: { type: String, trim: true, default: "" },
    study: { type: String, trim: true, default: "" },
    institution: { type: String, trim: true, default: "" },
    start_date: { type: Date, default: null },
    end_date: { type: Date, default: null },
    is_until_now: { type: Boolean, default: false },
  },
  { _id: true, timestamps: true }
);

const SkillEmployeeSchema = new Schema(
  {
    skill_id: {
      type: Schema.Types.ObjectId,
      ref: "skills",
      default: null,
      index: true,
    },
    title: { type: String, trim: true, default: "" },
    years: { type: Number, default: 0, min: 0 },
    level: { type: Number, min: 1, max: 5, default: 3 },
  },
  { _id: true, timestamps: true }
);

const LanguageEmployeeSchema = new Schema(
  {
    language_id: {
      type: Schema.Types.ObjectId,
      ref: "languages",
      default: null,
      index: true,
    },
    level: { type: Number, min: 1, max: 5, default: 1 },
  },
  { _id: true, timestamps: true }
);

const SimpleCertificateSchema = new Schema(
  {
    name: { type: String, trim: true, default: "" },
    end_in: { type: Date, default: null },
    is_for_ever: { type: Boolean, default: false },
  },
  { _id: true, timestamps: true }
);

const LinkSchema = new Schema(
  {
    title: { type: String, trim: true, default: "" },
    url: { type: String, trim: true, default: "" },
  },
  { _id: true, timestamps: true }
);
const EmployeeCvFileSchema = new Schema(
  {
    url: { type: String, trim: true, required: true },
    fileName: { type: String, trim: true, required: true },

    template_key: { type: String, trim: true, default: "" },
    title: { type: String, trim: true, default: "" },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "inactive",
      index: true,
    },

    created_from_builder: { type: Boolean, default: true },
  },
  { _id: true, timestamps: true }
);
const ExpectedSalarySchema = new Schema(
  {
    min: { type: Number, default: null, min: 0 },
    max: { type: Number, default: null, min: 0 },

    currency_id: {
      type: Schema.Types.ObjectId,
      ref: "currencies",
      default: null,
      index: true,
    },

    currency_code: {
      type: String,
      uppercase: true,
      trim: true,
      default: "",
      index: true,
    },

    currency_symbol: { type: String, trim: true, default: "" },

    currency_rate_base: {
      type: String,
      uppercase: true,
      trim: true,
      default: "USD",
    },

    currency_rate: { type: Number, default: 1, min: 0 },
    min_base: { type: Number, default: null, min: 0, index: true },
    max_base: { type: Number, default: null, min: 0, index: true },
  },
  { _id: false }
);

const JobAlertSchema = new Schema(
  {
    keyword: { type: String, trim: true, default: "" },
    countries: { type: [String], default: [] },
    job_type_id: {
      type: Schema.Types.ObjectId,
      ref: "job_type",
      default: null,
      index: true,
    },
    work_mode_id: {
      type: Schema.Types.ObjectId,
      ref: "work_modes",
      default: null,
      index: true,
    },
    is_active: { type: Boolean, default: true, index: true },
  },
  { _id: true, timestamps: true }
);

const SearchFiltersSchema = new Schema(
  {
    text: {
      profile: { type: [String], default: [] },
      all: { type: [String], default: [], index: true },
    },

    career: {
      candidate_stage: { type: String, default: "unknown", index: true },
      is_student: { type: Boolean, default: false, index: true },
      graduation_year: { type: Number, default: null, index: true },
      experience_years: { type: Number, default: 0, index: true },
      experience_level_id: {
        type: Schema.Types.ObjectId,
        ref: "experience_levels",
        default: null,
        index: true,
      },
      notice_period_id: {
        type: Schema.Types.ObjectId,
        ref: "work_time",
        default: null,
        index: true,
      },
      work_location: { type: String, default: "unknown", index: true },
      is_can_move: { type: Boolean, default: false, index: true },
      is_free_for_work: { type: Boolean, default: false, index: true },
      profile_visibility: { type: String, default: "public", index: true },
      accepted: { type: Boolean, default: false, index: true },
      status: { type: Boolean, default: true, index: true },
    },

    job_names: {
      ids: [{ type: Schema.Types.ObjectId, ref: "Job_name", index: true }],
      titles_ar: { type: [String], default: [] },
      titles_en: { type: [String], default: [] },
      keywords: { type: [String], default: [] },
      sectors_ar: { type: [String], default: [] },
      sectors_en: { type: [String], default: [] },
      sub_sectors_ar: { type: [String], default: [] },
      sub_sectors_en: { type: [String], default: [] },
    },

    job_types: {
      ids: [{ type: Schema.Types.ObjectId, ref: "job_type", index: true }],
      names: { type: [String], default: [] },
      titles_ar: { type: [String], default: [] },
      titles_en: { type: [String], default: [] },
      keywords: { type: [String], default: [] },
    },

    skills: {
      ids: [{ type: Schema.Types.ObjectId, ref: "skills", index: true }],
      titles_ar: { type: [String], default: [] },
      titles_en: { type: [String], default: [] },
      titles_custom: { type: [String], default: [] },
      keywords_ar: { type: [String], default: [] },
      keywords_en: { type: [String], default: [] },
      categories: { type: [String], default: [] },
      min_level: { type: Number, default: null, index: true },
      max_level: { type: Number, default: null, index: true },
      max_years: { type: Number, default: null, index: true },
    },

    languages: {
      ids: [{ type: Schema.Types.ObjectId, ref: "languages", index: true }],
      names: { type: [String], default: [] },
      titles_ar: { type: [String], default: [] },
      titles_en: { type: [String], default: [] },
      min_level: { type: Number, default: null, index: true },
      max_level: { type: Number, default: null, index: true },
    },

    education: {
      level_ids: [
        { type: Schema.Types.ObjectId, ref: "education_levels", index: true },
      ],
      levels: { type: [String], default: [] },
      studies: { type: [String], default: [] },
      institutions: { type: [String], default: [] },
    },

    preferred_work_modes: {
      ids: [{ type: Schema.Types.ObjectId, ref: "work_modes", index: true }],
      keys: { type: [String], default: [] },
      titles_ar: { type: [String], default: [] },
      titles_en: { type: [String], default: [] },
      keywords_ar: { type: [String], default: [] },
      keywords_en: { type: [String], default: [] },
    },

    preferred_countries: {
      values: { type: [String], default: [], index: true },
      country_codes: { type: [String], default: [], index: true },
      country_names_ar: { type: [String], default: [] },
      country_names_en: { type: [String], default: [] },
      city_names_ar: { type: [String], default: [] },
      city_names_en: { type: [String], default: [] },
    },

    salary: {
      min: { type: Number, default: null, index: true },
      max: { type: Number, default: null, index: true },
      min_base: { type: Number, default: null, index: true },
      max_base: { type: Number, default: null, index: true },
      currency_id: {
        type: Schema.Types.ObjectId,
        ref: "currencies",
        default: null,
        index: true,
      },
      currency_code: { type: String, default: "", uppercase: true, index: true },
    },
  },
  { _id: false }
);

const EmployeeSchema = new Schema(
  {
    matching_profile: {
      normalized_skills: { type: [String], default: [] },
      normalized_languages: { type: [String], default: [] },
      normalized_titles: { type: [String], default: [] },
      normalized_job_names: { type: [String], default: [] },
      normalized_job_types: { type: [String], default: [] },
      preferred_country_values: { type: [String], default: [] },
      preferred_work_mode_keys: { type: [String], default: [] },

      career_tags: { type: [String], default: [] },
      searchable_tokens: { type: [String], default: [] },
      searchable_text: { type: String, default: "" },

      seniority_score: { type: Number, default: 0 },
      salary_min_base: { type: Number, default: null },
      salary_max_base: { type: Number, default: null },

      remote_ready: { type: Boolean, default: false },
      relocation_ready: { type: Boolean, default: false },
      free_for_work: { type: Boolean, default: true },
    },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: true,
      unique: true,
      index: true,
    },
    role_id: { type: Schema.Types.ObjectId, ref: "roles", required: true },
    permissions: { type: [String], default: [] },

    status: { type: Boolean, default: true, index: true },
    accepted: { type: Boolean, default: false, index: true },

    profile_headline: { type: String, default: "", trim: true },
    current_job_title: { type: String, default: "", trim: true },
    about_me: { type: String, default: "", trim: true },
    profile_completion: { type: Number, default: 0, min: 0, max: 100 },
    birthday: { type: Date, default: null, index: true },
    candidate_stage: {
      type: String,
      enum: [
        "student",
        "graduate",
        "fresh_graduate",
        "experienced",
        "career_changer",
        "unknown",
      ],
      default: "unknown",
      index: true,
    },
    is_student: { type: Boolean, default: false, index: true },
    graduation_year: { type: Number, default: null, index: true },
    experience_years: { type: Number, default: 0, min: 0, index: true },
    experience_level_id: {
      type: Schema.Types.ObjectId,
      ref: "experience_levels",
      default: null,
      index: true,
    },
    cvs: { type: [EmployeeCvFileSchema], default: [] },
    latest_work_experience: { type: ExperienceSchema, default: null },
    experience: { type: [ExperienceSchema], default: [] },
    education: { type: [EducationSchema], default: [] },
    skills: { type: [SkillEmployeeSchema], default: [] },
    languages: { type: [LanguageEmployeeSchema], default: [] },
    licenses: { type: [SimpleCertificateSchema], default: [] },
    testimony: { type: [SimpleCertificateSchema], default: [] },

    job_names: [{ type: Schema.Types.ObjectId, ref: "job_name", index: true }],
    job_types: [{ type: Schema.Types.ObjectId, ref: "job_type", index: true }],
    preferred_work_modes: [
      { type: Schema.Types.ObjectId, ref: "work_modes", index: true },
    ],
    preferred_countries: [
      { type: Schema.Types.ObjectId, ref: "countries", index: true },
    ],

    expected_salary: { type: ExpectedSalarySchema, default: () => ({}) },

    notice_period_id: {
      type: Schema.Types.ObjectId,
      ref: "work_time",
      default: null,
      index: true,
    },
    is_can_move: { type: Boolean, default: true, index: true },
    is_free_for_work: { type: Boolean, default: true, index: true },
    work_location: {
      type: String,
      enum: ["remote", "hybrid", "onsite", "field", "unknown"],
      default: "unknown",
      index: true,
    },

    links: { type: [LinkSchema], default: [] },
    profile_visibility: {
      type: String,
      enum: ["public", "private", "companies_only"],
      default: "public",
      index: true,
    },
    blocked_companies: [{ type: Schema.Types.ObjectId, ref: "companies" }],
    job_alerts: { type: [JobAlertSchema], default: [] },

    search_filters: { type: SearchFiltersSchema, default: () => ({}) },
  },
  { collection: "employees", timestamps: true }
);

EmployeeSchema.index({ "expected_salary.min_base": 1 });
EmployeeSchema.index({ "expected_salary.max_base": 1 });
EmployeeSchema.index({ "expected_salary.currency_code": 1 });
EmployeeSchema.index({ accepted: 1, status: 1, is_free_for_work: 1 });
EmployeeSchema.index({ candidate_stage: 1, experience_years: 1 });
EmployeeSchema.index({ "skills.skill_id": 1 });
EmployeeSchema.index({ preferred_countries: 1 });
EmployeeSchema.index({ job_names: 1 });
EmployeeSchema.index({ job_types: 1 });
EmployeeSchema.index({ preferred_work_modes: 1 });
EmployeeSchema.index({ "search_filters.career.accepted": 1, "search_filters.career.status": 1 });
EmployeeSchema.index({ "search_filters.career.is_free_for_work": 1 });
EmployeeSchema.index({ "search_filters.career.candidate_stage": 1 });
EmployeeSchema.index({ "search_filters.career.experience_years": 1 });
EmployeeSchema.index({ "search_filters.career.work_location": 1 });
EmployeeSchema.index({ "search_filters.job_name.ids": 1 });
EmployeeSchema.index({ "search_filters.job_name.keywords": 1 });
EmployeeSchema.index({ "search_filters.job_types.ids": 1 });
EmployeeSchema.index({ "search_filters.job_types.names": 1 });
EmployeeSchema.index({ "search_filters.skills.ids": 1 });
EmployeeSchema.index({ "search_filters.skills.categories": 1 });
EmployeeSchema.index({ "search_filters.languages.ids": 1 });
EmployeeSchema.index({ "search_filters.education.level_ids": 1 });
EmployeeSchema.index({ "search_filters.preferred_work_modes.ids": 1 });
EmployeeSchema.index({ "search_filters.preferred_countries.values": 1 });
EmployeeSchema.index({ "search_filters.preferred_countries.country_codes": 1 });
EmployeeSchema.index({ "search_filters.salary.min_base": 1 });
EmployeeSchema.index({ "search_filters.salary.max_base": 1 });
EmployeeSchema.index({ "matching_profile.normalized_skills": 1 });
EmployeeSchema.index({ "matching_profile.normalized_languages": 1 });
EmployeeSchema.index({ "matching_profile.normalized_titles": 1 });
EmployeeSchema.index({ "matching_profile.preferred_country_values": 1 });
EmployeeSchema.index({ "matching_profile.preferred_work_mode_keys": 1 });
EmployeeSchema.index({ "matching_profile.seniority_score": -1 });
EmployeeSchema.index({ "matching_profile.salary_min_base": 1 });
EmployeeSchema.index({ "matching_profile.salary_max_base": 1 });
EmployeeSchema.index({ "matching_profile.searchable_tokens": 1 });
EmployeeSchema.index({
  profile_headline: "text",
  current_job_title: "text",
  about_me: "text",
  "search_filters.text.all": "text",
});

const EmployeeModel = mongoose.model("employees", EmployeeSchema);

export default EmployeeModel;
