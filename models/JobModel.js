import mongoose from "mongoose";

const { Schema } = mongoose;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

const uniqueClean = (arr = []) => [
  ...new Set(
    arr
      .flat(Infinity)
      .map((x) => String(x || "").trim())
      .filter(Boolean)
  ),
];

const normalizeSearchToken = (value = "") =>
  String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g, "")
    .replace(/[\u0622\u0623\u0625]/g, "ا")
    .replace(/\u0649/g, "ي")
    .replace(/\u0640/g, "")
    .replace(/[^a-z0-9\u0600-\u06FF]+/gi, " ")
    .trim();

const buildTokens = (...groups) =>
  uniqueClean(groups).map(normalizeSearchToken).filter(Boolean);

const getLookupTitle = (doc = {}) =>
  String(doc?.title_ar || doc?.title_en || doc?.title || doc?.name || doc?.key || "").trim();

const toIdString = (value) => String(value?._id || value || "").trim();
const JobQuestionOptionSchema = new Schema(
  {
    label: { type: String, required: true, trim: true },
    is_correct: { type: Boolean, default: false },
  },
  { _id: true }
);
const JobQuestionSchema = new Schema(
  {
    question: { type: String, required: true, trim: true },

    type: {
      type: String,
      enum: [
        "text",
        "textarea",
        "yes_no",
        "single_choice",
        "multi_choice",
        "number",
        "file",
      ],
      default: "text",
    },

    options: {
      type: [JobQuestionOptionSchema],
      default: [],
    },

    is_required: { type: Boolean, default: false },
    is_knockout: { type: Boolean, default: false, index: true },
    weight: { type: Number, default: 1, min: 0, max: 100 },
    knockout_expected_answer: { type: Schema.Types.Mixed, default: null },
    knockout_action: {
      type: String,
      enum: ["mark_not_match", "needs_manual_review", "reject"],
      default: "mark_not_match",
    },

    correct_answer: {
      type: Schema.Types.Mixed,
      default: null,
    },

    help_text: { type: String, default: "", trim: true },
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


const JobLifecycleSchema = new Schema(
  {
    auto_closed_at: { type: Date, default: null, index: true },
    auto_close_reason: { type: String, trim: true, default: "" },
    last_deadline_checked_at: { type: Date, default: null },
    reminders: {
      company_7d_at: { type: Date, default: null },
      company_3d_at: { type: Date, default: null },
      company_72h_at: { type: Date, default: null },
      company_24h_at: { type: Date, default: null },
      saved_7d_at: { type: Date, default: null },
      saved_3d_at: { type: Date, default: null },
      saved_72h_at: { type: Date, default: null },
      saved_24h_at: { type: Date, default: null },
      closed_company_at: { type: Date, default: null },
      closed_applicants_at: { type: Date, default: null },
    },
  },
  { _id: false }
);

const JobServiceSnapshotSchema = new Schema(
  {
    service_id: { type: Schema.Types.ObjectId, ref: "job_service", default: null },
    title: { type: String, trim: true },
    name: { type: String, trim: true },
    title_ar: { type: String, trim: true },
    title_en: { type: String, trim: true },
  },
  { _id: false }
);

const AtsWeightsSchema = new Schema(
  {
    skills: { type: Number, default: 35, min: 0, max: 100 },
    experience: { type: Number, default: 20, min: 0, max: 100 },
    education: { type: Number, default: 10, min: 0, max: 100 },
    languages: { type: Number, default: 10, min: 0, max: 100 },
    location: { type: Number, default: 10, min: 0, max: 100 },
    salary: { type: Number, default: 5, min: 0, max: 100 },
    questions: { type: Number, default: 10, min: 0, max: 100 },
  },
  { _id: false }
);

const AtsSettingsSchema = new Schema(
  {
    weights: { type: AtsWeightsSchema, default: () => ({}) },
    auto_reject_on_knockout: { type: Boolean, default: false },
    manual_review_on_knockout: { type: Boolean, default: true },
    min_score_for_initial_match: { type: Number, default: 80, min: 0, max: 100 },
    min_score_for_review: { type: Number, default: 50, min: 0, max: 100 },
  },
  { _id: false }
);

const JobTrustDocumentLinkSchema = new Schema(
  {
    url: { type: String, required: true, trim: true },
    label: { type: String, trim: true, default: "" },
    kind: { type: String, trim: true, default: "evidence" },
  },
  { _id: true }
);

const JobTrustDocumentRequestSchema = new Schema(
  {
    status: {
      type: String,
      enum: ["none", "requested", "submitted", "accepted", "rejected"],
      default: "none",
      index: true,
    },
    note: { type: String, trim: true, default: "" },
    requested_by: { type: Schema.Types.ObjectId, ref: "users", default: null },
    requested_at: { type: Date, default: null },
  },
  { _id: false }
);

const JobTrustDocumentResponseSchema = new Schema(
  {
    status: {
      type: String,
      enum: ["none", "requested", "submitted", "accepted", "rejected"],
      default: "none",
      index: true,
    },
    note: { type: String, trim: true, default: "" },
    links: { type: [JobTrustDocumentLinkSchema], default: [] },
    submitted_by: { type: Schema.Types.ObjectId, ref: "users", default: null },
    submitted_at: { type: Date, default: null },
    reviewed_by: { type: Schema.Types.ObjectId, ref: "users", default: null },
    reviewed_at: { type: Date, default: null },
  },
  { _id: false }
);

const JobTrustSchema = new Schema(
  {
    score: { type: Number, min: 0, max: 100, default: 50, index: true },
    risk_level: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
      index: true,
    },
    flags: { type: [String], default: [] },
    report_count: { type: Number, min: 0, default: 0, index: true },
    duplicate_count: { type: Number, min: 0, default: 0 },
    review_status: {
      type: String,
      enum: ["unreviewed", "safe", "needs_documents", "suspended"],
      default: "unreviewed",
      index: true,
    },
    admin_note: { type: String, trim: true, default: "" },
    document_request: { type: JobTrustDocumentRequestSchema, default: () => ({}) },
    document_response: { type: JobTrustDocumentResponseSchema, default: () => ({}) },
    reviewed_by: { type: Schema.Types.ObjectId, ref: "users", default: null },
    reviewed_at: { type: Date, default: null },
    last_scored_at: { type: Date, default: null },
  },
  { _id: false }
);

const JobsSchema = new Schema(
  {
    search_projection: {
      company: {
        id: { type: Schema.Types.ObjectId, ref: "companies", default: null },
        name: { type: String, default: "" },
        logo: { type: String, default: null },
        industry_name: { type: String, default: "" },
        company_size_type: { type: String, default: "unknown" },
        company_type: { type: String, default: "" },
        country: { type: String, default: "" },
        city: { type: String, default: "" },
        verified: { type: Boolean, default: false },
        rating: { type: Number, default: 0 },
        active_jobs_count: { type: Number, default: 0 },
      },

      requirements: {
        skills: { type: [String], default: [] },
        languages: { type: [String], default: [] },
        countries: { type: [String], default: [] },
        work_mode: { type: String, default: "" },
        job_type: { type: String, default: "" },
        work_time: { type: String, default: "" },
        experience_level: { type: String, default: "" },
        education_level: { type: String, default: "" },
        min_experience_years: { type: Number, default: 0 },
        max_experience_years: { type: Number, default: null },
        salary_min_usd: { type: Number, default: null },
        salary_max_usd: { type: Number, default: null },
        candidate_target: { type: [String], default: [] },
        is_remote: { type: Boolean, default: false },
      },

      ranking: {
        quality_score: { type: Number, default: 0 },
        freshness_score: { type: Number, default: 0 },
        popularity_score: { type: Number, default: 0 },
        company_score: { type: Number, default: 0 },
        total_score: { type: Number, default: 0 },
      },

      matching: {
        tokens: { type: [String], default: [] },
        text: { type: String, default: "" },
        normalized_skills: { type: [String], default: [] },
        normalized_titles: { type: [String], default: [] },
      },
    },
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
        cities: { type: [String], default: [] },
        city: { type: String, default: "" },
        job_type: { type: String, default: "" },
        job_type_id: { type: String, default: "" },
        work_time: { type: String, default: "" },
        job_time_id: { type: String, default: "" },
        work_mode: { type: String, default: "" },
        work_mode_id: { type: String, default: "" },
        salary_type: { type: String, default: "" },
        job_salary_id: { type: String, default: "" },
        currency: { type: String, default: "" },
        currency_id: { type: String, default: "" },
        candidate_target: { type: [String], default: [] },
        experience_level: { type: String, default: "" },
        experience_level_id: { type: String, default: "" },
        education_level: { type: String, default: "" },
        education_level_id: { type: String, default: "" },
        is_remote: { type: Boolean, default: false },
        is_for_students: { type: Boolean, default: false },
        is_for_graduates: { type: Boolean, default: false },
        is_for_fresh_graduates: { type: Boolean, default: false },
        languages: { type: [String], default: [] },
        skills: { type: [String], default: [] },
        services: { type: [String], default: [] },
        salary_min: { type: Number, default: null },
        salary_max: { type: Number, default: null },
        salary_min_usd: { type: Number, default: null },
        salary_max_usd: { type: Number, default: null },
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
    description: { type: String, required: true, trim: true, minlength: 50, maxlength: 5000 },
    ref: { type: String, trim: true, unique: true, sparse: true, index: true },
    job_keywords: { type: [String], default: [] },
    keywords_norm: { type: [String], default: [] },
    phrases_norm: { type: [String], default: [] },

    status: { type: Boolean, default: true, index: true },
    is_accepted: { type: Boolean, default: false, index: true },
    publish_status: { type: String, enum: ["pending_review", "published", "paused", "closed", "rejected", "archived"], default: "pending_review", index: true },
    started_date: { type: Date, default: null },
    end_date: { type: Date, default: null },
    apply_deadline: { type: Date, default: null, index: true },
    closing_mode: {
      type: String,
      enum: ["fixed_date", "continuous_until_filled", "immediate_hiring"],
      default: "fixed_date",
      index: true,
    },
    hide_closing_date: { type: Boolean, default: false },
    is_update: { type: Boolean, default: false },
    vacancies_count: { type: Number, default: 1, min: 1 },
    priority: { type: Number, default: 0, min: 0 },
    reviewed_at: { type: Date, default: null },
    reviewed_by: { type: Schema.Types.ObjectId, ref: "users", default: null },
    rejection_reason: { type: String, trim: true, default: "" },
    trust: { type: JobTrustSchema, default: () => ({}) },

    job_lifecycle: { type: JobLifecycleSchema, default: () => ({}) },

    countries: { type: [String], default: [] },
    cities: { type: [String], default: [], index: true },
    city: { type: String, default: "", trim: true },
    address: { type: String, default: "", trim: true },
    work_location_scope: {
      type: String,
      enum: ["local", "international", "both"],
      default: "local",
      index: true,
    },

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
    age_min: { type: Number, default: null, min: 14, max: 100 },
    age_max: { type: Number, default: null, min: 14, max: 100 },
    gender_requirement: { type: String, enum: ["any", "male", "female"], default: "any" },
    marital_status: { type: [String], default: [] },
    academic_certificates: { type: [String], default: [] },
    professional_certificates: { type: [String], default: [] },
    driving_license_required: { type: Boolean, default: false },

    candidate_target: { type: [String], enum: ["students", "graduates", "fresh_graduates", "experienced", "career_changers", "all"], default: ["all"], index: true },
    is_for_students: { type: Boolean, default: false, index: true },
    is_for_graduates: { type: Boolean, default: false, index: true },
    is_for_fresh_graduates: { type: Boolean, default: false, index: true },

    skills_required: { type: [SkillRequirementSchema], default: [] },
    skills_optional: { type: [SkillRequirementSchema], default: [] },
    languages: [{ language_id: { type: Schema.Types.ObjectId, ref: "languages", default: null }, name: { type: String, trim: true }, level: { type: Number, min: 1, max: 5, default: 1 }, level_text: { type: String, trim: true, default: "" } }],

    salary: {
      min: { type: Number, default: null, min: 0 },
      max: { type: Number, default: null, min: 0 },
      currency_id: { type: Schema.Types.ObjectId, ref: "currencies", required: true },
      currency_code: { type: String, required: true, uppercase: true, trim: true },
      currency_rate_snapshot: { type: Number, required: true, min: 0, default: 1 },
      min_usd: { type: Number, default: null, min: 0 },
      max_usd: { type: Number, default: null, min: 0 },
      mode: { type: String, enum: ["fixed", "range", "negotiable", "depends_on_experience", "hidden"], default: "range" },
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

    questions: { type: [JobQuestionSchema], validate: [{ validator: (v) => !v || v.length <= 50, message: "questions max length is 50" }], default: [] },
    ats_settings: { type: AtsSettingsSchema, default: () => ({}) },
    created_by: { type: Schema.Types.ObjectId, ref: "users", default: null, index: true },
    updated_by: { type: Schema.Types.ObjectId, ref: "users", default: null, index: true },
    stopped_by: { type: Schema.Types.ObjectId, ref: "users", default: null },
    archived_by: { type: Schema.Types.ObjectId, ref: "users", default: null },
    deleted_by: { type: Schema.Types.ObjectId, ref: "users", default: null },
    deleted_at: { type: Date, default: null, index: true },
    last_action: { type: String, trim: true, default: "" },
    company_id: { type: Schema.Types.ObjectId, ref: "companies", required: true, index: true },
    user_id: { type: Schema.Types.ObjectId, ref: "users", required: true, index: true },
  },
  { collection: "jobs", timestamps: true }
);

const rebuildJobSearchFilters = (job) => {
  const skillTitles = uniqueClean([
    (job.skills_required || []).map((x) => x.title),
    (job.skills_optional || []).map((x) => x.title),
  ]);

  const languageNames = uniqueClean((job.languages || []).map((x) => x.name));
  const serviceTitles = uniqueClean(
    (job.job_services || []).map((x) => [x.title, x.name, x.title_ar, x.title_en])
  );

  const jobTypeTitle = getLookupTitle(job.job_type_info);
  const workModeTitle = getLookupTitle(job.work_mode_info);
  const workTimeTitle = getLookupTitle(job.job_time_info);
  const salaryTypeTitle = getLookupTitle(job.job_salary_info);
  const experienceTitle = getLookupTitle(job.experience_level_info);
  const educationTitle = getLookupTitle(job.education_level_info);

  const titleTokens = buildTokens(job.job_name, job.job_keywords);
  const skillTokens = buildTokens(skillTitles);
  const serviceTokens = buildTokens(serviceTitles);
  const countryTokens = buildTokens(job.countries, job.cities, job.city);
  const companyTokens = buildTokens(job.search_projection?.company?.name, job.search_projection?.company?.industry_name);
  const sectorTokens = buildTokens(jobTypeTitle, workModeTitle, workTimeTitle, salaryTypeTitle, experienceTitle, educationTitle);
  const allTokens = buildTokens(
    titleTokens,
    job.description,
    skillTokens,
    languageNames,
    serviceTokens,
    countryTokens,
    companyTokens,
    sectorTokens,
    job.candidate_target
  );

  job.keywords_norm = uniqueClean([job.keywords_norm || [], titleTokens, skillTokens, serviceTokens]);
  job.phrases_norm = uniqueClean([job.phrases_norm || [], job.job_name, skillTitles, serviceTitles]);

  job.search_index = {
    ...(job.search_index || {}),
    title_norm: normalizeSearchToken(job.job_name),
    description_norm: normalizeSearchToken(job.description),
    text_norm: allTokens.join(" "),
    tokens: allTokens,
    phrases: uniqueClean([job.job_name, skillTitles, serviceTitles, languageNames]),
    aliases: uniqueClean([job.job_keywords, job.keywords_norm, job.phrases_norm]),
    title_tokens: titleTokens,
    skill_tokens: skillTokens,
    company_tokens: companyTokens,
    service_tokens: serviceTokens,
    country_tokens: countryTokens,
    sector_tokens: sectorTokens,
    filters: {
      countries: uniqueClean(job.countries || []),
      cities: uniqueClean(job.cities || []),
      city: job.city || "",
      job_type: jobTypeTitle,
      job_type_id: toIdString(job.job_type_id),
      work_time: workTimeTitle,
      job_time_id: toIdString(job.job_time_id),
      work_mode: workModeTitle,
      work_mode_id: toIdString(job.work_mode_id),
      salary_type: salaryTypeTitle,
      job_salary_id: toIdString(job.job_salary_id),
      currency: job.salary?.currency_code || "",
      currency_id: toIdString(job.salary?.currency_id),
      candidate_target: uniqueClean(job.candidate_target || []),
      experience_level: experienceTitle,
      experience_level_id: toIdString(job.experience_level_id),
      education_level: educationTitle,
      education_level_id: toIdString(job.education_level_id),
      is_remote: Boolean(job.is_remote),
      is_for_students: Boolean(job.is_for_students),
      is_for_graduates: Boolean(job.is_for_graduates),
      is_for_fresh_graduates: Boolean(job.is_for_fresh_graduates),
      languages: languageNames,
      skills: skillTitles,
      services: serviceTitles,
      salary_min: job.salary?.min ?? null,
      salary_max: job.salary?.max ?? null,
      salary_min_usd: job.salary?.min_usd ?? null,
      salary_max_usd: job.salary?.max_usd ?? null,
    },
    score_signals: {
      rating: Number(job.rating || 0),
      views: Number(job.user_show || 0),
      saves: Number(job.user_saved || 0),
      applies: Number(job.user_applying || 0),
      reviews: Number(job.user_review || 0),
    },
  };
};


const buildJobRef = (year, seq) => `HJ-${year}-${String(seq).padStart(4, "0")}`;

JobsSchema.pre("validate", async function (next) {
  try {
    if (!this.ref) {
      const year = new Date().getFullYear();
      const count = await this.constructor.countDocuments({ ref: new RegExp(`^HJ-${year}-`) });
      for (let i = 1; i <= 25; i += 1) {
        const candidate = buildJobRef(year, count + i);
        const exists = await this.constructor.exists({ ref: candidate });
        if (!exists) {
          this.ref = candidate;
          break;
        }
      }
      if (!this.ref) this.ref = `HJ-${year}-${Date.now().toString().slice(-6)}`;
    }

    if (this.description && (this.description.length < 50 || this.description.length > 5000)) {
      return next(new Error("job_description_length_must_be_between_50_and_5000"));
    }

    if (this.started_date && this.end_date && new Date(this.started_date) > new Date(this.end_date)) {
      return next(new Error("started_date_cannot_be_after_end_date"));
    }

    if (this.apply_deadline && this.end_date && new Date(this.apply_deadline) > new Date(this.end_date)) {
      return next(new Error("apply_deadline_must_be_before_or_equal_end_date"));
    }

    if (this.age_min != null && this.age_max != null && Number(this.age_min) > Number(this.age_max)) {
      return next(new Error("age_min_cannot_be_greater_than_age_max"));
    }
  } catch (error) {
    return next(error);
  }

  if (this.publish_status === "draft") this.publish_status = "pending_review";
  if (!this.publish_status) this.publish_status = "pending_review";

  if (this.publish_status === "published") {
    this.is_accepted = true;
    this.status = true;
  } else if (["pending_review", "rejected"].includes(this.publish_status)) {
    this.is_accepted = false;
    if (this.publish_status === "rejected") this.status = false;
  }

  if (this.salary?.mode === "hidden") this.salary.is_visible = false;
  if (["negotiable", "depends_on_experience"].includes(this.salary?.mode)) this.salary.is_negotiable = true;
  if (this.salary?.min != null && this.salary?.max != null && this.salary.min > this.salary.max) return next(new Error("salary.min cannot be greater than salary.max"));
  if (this.min_experience_years != null && this.max_experience_years != null && this.min_experience_years > this.max_experience_years) return next(new Error("min_experience_years cannot be greater than max_experience_years"));
  if (this.salary && this.salary.currency_rate_snapshot > 0) {
    if (this.salary.min != null) this.salary.min_usd = this.salary.min / this.salary.currency_rate_snapshot;
    if (this.salary.max != null) this.salary.max_usd = this.salary.max / this.salary.currency_rate_snapshot;
  }

  let targets = Array.isArray(this.candidate_target) ? this.candidate_target.filter(Boolean) : [];

  if (!targets.length || targets.includes("all")) {
    const explicitTargets = [];
    if (this.is_for_students) explicitTargets.push("students");
    if (this.is_for_graduates) explicitTargets.push("graduates");
    if (this.is_for_fresh_graduates) explicitTargets.push("fresh_graduates");
    targets = explicitTargets.length ? explicitTargets : ["all"];
  }

  this.candidate_target = uniqueClean(targets);
  this.is_for_students = this.candidate_target.includes("students");
  this.is_for_graduates = this.candidate_target.includes("graduates");
  this.is_for_fresh_graduates = this.candidate_target.includes("fresh_graduates");

  rebuildJobSearchFilters(this);
  next();
});

JobsSchema.index({ ref: 1 }, { unique: true, sparse: true });
JobsSchema.index({ status: 1, is_accepted: 1, publish_status: 1, createdAt: -1 });
JobsSchema.index({ publish_status: 1, status: 1, apply_deadline: 1 });
JobsSchema.index({ publish_status: 1, status: 1, end_date: 1 });
JobsSchema.index({ "job_lifecycle.auto_closed_at": 1 });
JobsSchema.index({ company_id: 1, status: 1, is_accepted: 1 });
JobsSchema.index({ company_id: 1, deleted_at: 1, createdAt: -1 });
JobsSchema.index({ countries: 1, status: 1, is_accepted: 1, createdAt: -1 });
JobsSchema.index({ cities: 1, status: 1, is_accepted: 1, createdAt: -1 });
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
JobsSchema.index({ "search_index.filters.cities": 1 });
JobsSchema.index({ "search_index.filters.job_type": 1 });
JobsSchema.index({ "search_index.filters.work_time": 1 });
JobsSchema.index({ "search_index.filters.work_mode": 1 });
JobsSchema.index({ "search_index.filters.salary_type": 1 });
JobsSchema.index({ "search_index.filters.currency": 1 });
JobsSchema.index({ "search_index.filters.salary_min_usd": 1 });
JobsSchema.index({ "search_index.filters.salary_max_usd": 1 });
JobsSchema.index({ "search_index.filters.skills": 1 });
JobsSchema.index({ "search_index.filters.languages": 1 });
JobsSchema.index({ "search_index.filters.services": 1 });
JobsSchema.index({ "search_index.filters.candidate_target": 1 });
JobsSchema.index({ "search_index.filters.is_remote": 1 });
JobsSchema.index({ "search_index.title_norm": "text", "search_index.text_norm": "text" });
JobsSchema.index({ job_name: "text", description: "text" });
JobsSchema.index({ "search_projection.company.id": 1 });
JobsSchema.index({ "search_projection.company.industry_name": 1 });
JobsSchema.index({ "search_projection.requirements.skills": 1 });
JobsSchema.index({ "search_projection.requirements.languages": 1 });
JobsSchema.index({ "search_projection.requirements.countries": 1 });
JobsSchema.index({ "search_projection.requirements.work_mode": 1 });
JobsSchema.index({ "search_projection.requirements.job_type": 1 });
JobsSchema.index({ "search_projection.requirements.experience_level": 1 });
JobsSchema.index({ "search_projection.requirements.education_level": 1 });
JobsSchema.index({ "search_projection.requirements.salary_min_usd": 1 });
JobsSchema.index({ "search_projection.requirements.salary_max_usd": 1 });
JobsSchema.index({ "search_projection.ranking.total_score": -1 });
JobsSchema.index({ "search_projection.matching.tokens": 1 });
JobsSchema.index({ "search_projection.matching.text": "text" });
JobsSchema.index({ "trust.risk_level": 1, "trust.report_count": -1, updatedAt: -1 });
JobsSchema.index({ "trust.review_status": 1, updatedAt: -1 });

const jobsModel = mongoose.model("jobs", JobsSchema);
export default jobsModel;
