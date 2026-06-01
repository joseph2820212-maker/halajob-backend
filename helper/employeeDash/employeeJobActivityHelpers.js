import mongoose from "mongoose";

export const EMPLOYEE_APPLICATION_STATUSES = new Set([
  "waiting",
  "screening",
  "shortlisted",
  "interview",
  "offer",
  "accepted",
  "hired",
  "rejected",
  "withdrawn",
  "auto_cancel",
]);

export const EMPLOYEE_INTERVIEW_STATUSES = new Set([
  "scheduled",
  "rescheduled",
  "completed",
  "cancelled",
  "no_show",
  "accepted",
  "rejected",
]);

export const EMPLOYEE_OFFER_STATUSES = new Set([
  "sent",
  "seen",
  "accepted",
  "declined",
  "expired",
  "cancelled",
]);

export const isValidObjectId = (value) =>
  mongoose.Types.ObjectId.isValid(String(value || ""));

export const cleanText = (value = "") => String(value || "").trim();

export const toBool = (value) => {
  if (value === undefined || value === null || value === "") return undefined;
  if ([true, 1, "1", "true", "yes", "on"].includes(value)) return true;
  if ([false, 0, "0", "false", "no", "off"].includes(value)) return false;
  return undefined;
};

export const escapeRegex = (value = "") =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const parseArrayQuery = (value) => {
  if (value === undefined || value === null || value === "") return [];
  if (Array.isArray(value)) return value.map(String).map((x) => x.trim()).filter(Boolean);
  return String(value)
    .split(/[,;\n]+/)
    .map((x) => x.trim())
    .filter(Boolean);
};

export const safeStatus = (status, allowedSet) => {
  const value = cleanText(status);
  return allowedSet.has(value) ? value : null;
};

export const buildSearchRegex = (value = "") => {
  const text = cleanText(value);
  if (!text) return null;
  return new RegExp(escapeRegex(text), "i");
};

export const normalizeCompanyLite = (company) => {
  if (!company) return null;
  return {
    _id: company._id,
    company_name: company.company_name || company.name || "",
    name: company.company_name || company.name || "",
    image: company.image || company.logo || "",
    logo: company.logo || company.image || "",
    cover_image: company.cover_image || "",
    industry_name: company.industry_name || "",
    company_country: company.company_country || "",
    company_city: company.company_city || "",
    is_verified: Boolean(company.is_verified),
    rating_avg: company.rating_avg || 0,
    rating_count: company.rating_count || 0,
  };
};

export const normalizeJobLite = (job) => {
  if (!job) return null;
  return {
    _id: job._id,
    job_name_id: job.job_name_id || null,
    job_name: job.job_name || "",
    description: job.description || "",
    company: normalizeCompanyLite(job.company_id),
    city: job.city || "",
    countries: job.countries || [],
    cities: job.cities || [],
    work_mode: job.work_mode_info || job.work_mode_id || null,
    job_type: job.job_type_info || job.job_type_id || null,
    job_time: job.job_time_info || job.job_time_id || null,
    salary: job.salary || null,
    experience_level: job.experience_level_info || job.experience_level_id || null,
    education_level: job.education_level_info || job.education_level_id || null,
    skills_required: job.skills_required || [],
    skills_optional: job.skills_optional || [],
    languages: job.languages || [],
    is_remote: Boolean(job.is_remote),
    is_cv_required: job.is_cv_required !== false,
    publish_status: job.publish_status || "published",
    apply_deadline: job.apply_deadline || null,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    stats: {
      views: job.user_show || 0,
      applications: job.user_applying || 0,
      saved: job.user_saved || 0,
      reviews: job.user_review || 0,
      rating: job.rating || 0,
    },
  };
};

export const normalizeApplicationForEmployee = (application) => {
  if (!application) return null;
  const job = normalizeJobLite(application.job_id);
  return {
    _id: application._id,
    status: application.status || "waiting",
    status_changed_at: application.status_changed_at || null,
    applied_at: application.createdAt,
    last_activity_at: application.last_activity_at || application.updatedAt,
    source: application.source || "app",
    first_name: application.first_name || "",
    last_name: application.last_name || "",
    email: application.email || "",
    phone_code: application.phone_code || "",
    phone_national: application.phone_national || "",
    cv: application.cv || "",
    cover_letter: application.cover_letter || "",
    answers: application.answers || [],
    user_job_rating: application.user_job_rating || 0,
    cv_download: Boolean(application.cv_download),
    filter: {
      is_filter: Boolean(application.is_filter),
      filter_on: Boolean(application.filter_on),
      score: application.filter_result?.score ?? null,
      matched_skills: application.filter_result?.matched_skills || [],
      missing_skills: application.filter_result?.missing_skills || [],
      reason: application.filter_result?.reason || "",
    },
    job,
    company: normalizeCompanyLite(application.company_id) || job?.company || null,
  };
};

export const normalizeInterviewForEmployee = (interview) => {
  if (!interview) return null;
  const job = normalizeJobLite(interview.job_id);
  return {
    _id: interview._id,
    status: interview.status || "scheduled",
    type: interview.type || "online",
    start_at: interview.start_at,
    end_at: interview.end_at || null,
    timezone: interview.timezone || "UTC",
    meet_link: interview.meet_link || "",
    office_address: interview.office_address || "",
    longitude: interview.longitude ?? null,
    latitude: interview.latitude ?? null,
    company_note: interview.company_note || "",
    candidate_note: interview.candidate_note || "",
    result_note: interview.result_note || "",
    rating: interview.rating ?? null,
    reschedule_count: interview.reschedule_count || 0,
    job,
    company: normalizeCompanyLite(interview.company_id) || job?.company || null,
    application: applicationBrief(interview.application_id),
    createdAt: interview.createdAt,
    updatedAt: interview.updatedAt,
  };
};

export const normalizeOfferForEmployee = (offer) => {
  if (!offer) return null;
  const job = normalizeJobLite(offer.job_id);
  const expired = offer.expires_at && new Date(offer.expires_at).getTime() < Date.now();
  return {
    _id: offer._id,
    status: expired && ["sent", "seen"].includes(offer.status) ? "expired" : offer.status,
    message: offer.message || "",
    salary_offer: offer.salary_offer || "",
    starts_at: offer.starts_at || null,
    expires_at: offer.expires_at || null,
    responded_at: offer.responded_at || null,
    is_expired: Boolean(expired),
    sent_by: offer.sent_by || null,
    job,
    company: normalizeCompanyLite(offer.company_id) || job?.company || null,
    createdAt: offer.createdAt,
    updatedAt: offer.updatedAt,
  };
};

export const applicationBrief = (application) => {
  if (!application || typeof application !== "object") return application || null;
  return {
    _id: application._id,
    status: application.status,
    status_changed_at: application.status_changed_at,
    applied_at: application.createdAt,
    cv: application.cv || "",
    cover_letter: application.cover_letter || "",
  };
};

export const buildApplicationFilter = (employeeData, query = {}) => {
  const filter = { user_id: employeeData.userId };

  const status = safeStatus(query.status, EMPLOYEE_APPLICATION_STATUSES);
  if (status) filter.status = status;

  const jobId = query.job_id || query.jobId;
  const companyId = query.company_id || query.companyId;
  if (jobId && isValidObjectId(jobId)) filter.job_id = jobId;
  if (companyId && isValidObjectId(companyId)) filter.company_id = companyId;

  const statuses = parseArrayQuery(query.statuses || query.status_list || query.statusList)
    .filter((x) => EMPLOYEE_APPLICATION_STATUSES.has(x));
  if (statuses.length) filter.status = { $in: statuses };

  const searchRegex = buildSearchRegex(query.search || query.q || query.keyword);
  if (searchRegex) {
    filter.$or = [
      { first_name: searchRegex },
      { last_name: searchRegex },
      { email: searchRegex },
      { cover_letter: searchRegex },
    ];
  }

  const from = cleanText(query.from || query.date_from || query.start_date || query.startDate);
  const to = cleanText(query.to || query.date_to || query.end_date || query.endDate);
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }

  return filter;
};

export const buildInterviewFilter = (employeeData, query = {}) => {
  const filter = { employee_user_id: employeeData.userId };

  const status = safeStatus(query.status, EMPLOYEE_INTERVIEW_STATUSES);
  if (status) filter.status = status;

  const jobId = query.job_id || query.jobId;
  const applicationId = query.application_id || query.applicationId;
  const companyId = query.company_id || query.companyId;
  if (jobId && isValidObjectId(jobId)) filter.job_id = jobId;
  if (applicationId && isValidObjectId(applicationId)) filter.application_id = applicationId;
  if (companyId && isValidObjectId(companyId)) filter.company_id = companyId;

  const upcoming = toBool(query.upcoming);
  const past = toBool(query.past);
  if (upcoming === true) filter.start_at = { $gte: new Date() };
  if (upcoming === false || past === true) filter.start_at = { $lt: new Date() };

  const from = cleanText(query.from || query.date_from || query.start_date || query.startDate);
  const to = cleanText(query.to || query.date_to || query.end_date || query.endDate);
  if (from || to) {
    filter.start_at = filter.start_at || {};
    if (from) filter.start_at.$gte = new Date(from);
    if (to) filter.start_at.$lte = new Date(to);
  }

  return filter;
};

export const buildOfferFilter = (employeeData, query = {}) => {
  const filter = { user_id: employeeData.userId };

  const status = safeStatus(query.status, EMPLOYEE_OFFER_STATUSES);
  if (status) filter.status = status;

  const jobId = query.job_id || query.jobId;
  const companyId = query.company_id || query.companyId;
  if (jobId && isValidObjectId(jobId)) filter.job_id = jobId;
  if (companyId && isValidObjectId(companyId)) filter.company_id = companyId;

  const activeOnly = toBool(query.active);
  if (activeOnly === true) {
    filter.status = { $in: ["sent", "seen"] };
    filter.$or = [{ expires_at: null }, { expires_at: { $gte: new Date() } }];
  }

  return filter;
};

export const applicationPopulateForEmployee = [
  { path: "job_id", populate: [
    { path: "company_id", select: "company_name logo image cover_image company_country company_city company_type industry_name is_verified rating_avg rating_count" },
    { path: "work_mode_id" },
    { path: "job_type_id" },
    { path: "job_time_id" },
    { path: "job_salary_id" },
    { path: "experience_level_id" },
    { path: "education_level_id" },
    { path: "salary.currency_id" },
    { path: "skills_required.skill_id" },
    { path: "skills_optional.skill_id" },
    { path: "languages.language_id" },
  ] },
  { path: "company_id", select: "company_name logo image cover_image company_country company_city company_type industry_name is_verified rating_avg rating_count" },
];

export const interviewPopulateForEmployee = [
  { path: "application_id" },
  ...applicationPopulateForEmployee,
];

export const offerPopulateForEmployee = [
  ...applicationPopulateForEmployee,
  { path: "sent_by", select: "first_name mid_name last_name email image" },
];
