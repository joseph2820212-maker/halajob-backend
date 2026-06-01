import mongoose from "mongoose";
import {
  CompanyModel,
  CountryModel,
  jobsModel,
  UserApplyingJobModel,
  InterviewModel,
  CompanyReviewModel,
} from "../../models/index.js";

export const isValidObjectId = (value) =>
  mongoose.Types.ObjectId.isValid(String(value || ""));

export const toObjectIdArray = (value) => {
  const arr = Array.isArray(value)
    ? value
    : value === undefined || value === null
      ? []
      : [value];

  return [...new Set(arr.map((x) => String(x || "").trim()).filter(isValidObjectId))];
};

export const normalizeArrayPayload = (body = {}, key = "items") => {
  const value = body?.[key] ?? body?.items ?? body?.data ?? body;

  if (Array.isArray(value)) return value;

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return value
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);
    }
  }

  if (value && typeof value === "object") return [value];
  return [];
};

export const success = (res, data = null, message = "success", status = 200, meta = undefined) => {
  const payload = { success: true, message, data };
  if (meta !== undefined) payload.meta = meta;
  return res.status(status).json(payload);
};

export const fail = (res, message = "error", status = 400, errors = undefined) => {
  const payload = { success: false, message };
  if (errors !== undefined) payload.errors = errors;
  return res.status(status).json(payload);
};

export const getAuthUserId = (req) => {
  return (
    req.user?._id ||
    req.user?.id ||
    req.user_id ||
    req.auth?.user_id ||
    req.authUser?._id ||
    null
  );
};
export const companyPopulate = [
  {
    path: "owner_user_id",
    select: "-password -passcode -another_device_code -pending_device -device",
  },
  { path: "role_id" },
  { path: "industry_id" },
  { path: "country_id" },
  { path: "city_id" },
  { path: "languages.language_id" },
  { path: "verified_by", select: "first_name mid_name last_name email image" },
];

export const companyJobPopulate = [
  {
    path: "company_id",
    select:
      "company_name slug image cover_image company_country company_city industry_name is_verified rating_avg rating_count",
  },
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
  { path: "job_services.service_id" },
];

export const getCompanyPlain = async (req, res) => {
  const userId = getAuthUserId(req);

  if (!userId || !isValidObjectId(userId)) {
    fail(res, "unauthorized", 401);
    return null;
  }

  const company = await CompanyModel.findOne({ owner_user_id: userId });

  if (!company) {
    fail(res, "company_profile_not_found", 404);
    return null;
  }

  return company;
};

export const getCompanyOrFail = async (req, res) => {
  const company = await getCompanyPlain(req, res);
  if (!company) return null;

  await company.populate(companyPopulate);
  return company;
};

export const getCompanyUserIdOrFail = async (req, res) => {
  const company = await getCompanyOrFail(req, res);
  if (!company) return null;

  const userId = company.owner_user_id?._id || getAuthUserId(req);
  return { company, userId };
};

export const hasValue = (value) => {
  if (Array.isArray(value)) return value.length > 0;

  if (typeof value === "object" && value !== null) {
    return Object.values(value).some(
      (v) => v !== null && v !== undefined && v !== ""
    );
  }

  return value !== undefined && value !== null && value !== "";
};

export const hasText = (value) =>
  typeof value === "string" && value.trim().length > 0;

export const hasArray = (value) =>
  Array.isArray(value) && value.length > 0;

export const hasLocation = (company = {}) => {
  return (
    company?.location?.latitude !== null &&
    company?.location?.longitude !== null &&
    company?.location?.latitude !== undefined &&
    company?.location?.longitude !== undefined
  );
};

const normalizeSlug = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const normalizeEmail = (value = "") =>
  String(value || "").trim().toLowerCase();

const normalizeWebsite = (value = "") => {
  const website = String(value || "").trim();

  if (!website) return "";
  if (website.startsWith("http://") || website.startsWith("https://")) {
    return website;
  }

  return `https://${website}`;
};

export const resolveCompanySizeType = (size) => {
  const value = Number(size || 0);

  if (!value || Number.isNaN(value)) return "unknown";
  if (value <= 10) return "startup";
  if (value <= 50) return "small";
  if (value <= 250) return "medium";
  if (value <= 1000) return "large";

  return "enterprise";
};

const getTimezoneFromCountryDoc = (doc = {}) => {
  return (
    doc.timezone ||
    doc.time_zone ||
    doc.utc_timezone ||
    doc.default_timezone ||
    doc.tz ||
    ""
  );
};

export const applyCompanyAutoFields = async (company, touchedFields = []) => {
  const touched = new Set(touchedFields);

  if (touched.has("company_name") && !hasText(company.slug)) {
    company.slug = normalizeSlug(company.company_name);
    touched.add("slug");
  }

  if (hasText(company.slug)) {
    company.slug = normalizeSlug(company.slug);
    touched.add("slug");
  }

  if (hasText(company.company_email)) {
    company.company_email = normalizeEmail(company.company_email);
    touched.add("company_email");
  }

  if (hasText(company.hr_email)) {
    company.hr_email = normalizeEmail(company.hr_email);
    touched.add("hr_email");
  }

  if (hasText(company.company_website)) {
    company.company_website = normalizeWebsite(company.company_website);
    touched.add("company_website");
  }

  if (hasValue(company.company_size)) {
    company.company_size_type = resolveCompanySizeType(company.company_size);
    touched.add("company_size_type");
  }

  if (
    (company.country_id || company.city_id) &&
    (!hasText(company.timezone) || touched.has("country_id") || touched.has("city_id"))
  ) {
    const locationId = company.city_id || company.country_id;

    if (locationId && mongoose.Types.ObjectId.isValid(String(locationId))) {
      const countryDoc = await CountryModel.findById(locationId).lean();

      if (countryDoc) {
        if (!hasText(company.company_country)) {
          company.company_country = countryDoc.country_name_en || countryDoc.country_name_ar || "";
          touched.add("company_country");
        }

        if (!hasText(company.company_city)) {
          company.company_city = countryDoc.city_name_en || countryDoc.city_name_ar || "";
          touched.add("company_city");
        }

        const timezone = getTimezoneFromCountryDoc(countryDoc);
        if (hasText(timezone)) {
          company.timezone = timezone;
          touched.add("timezone");
        }
      }
    }
  }

  if (!hasText(company.timezone)) {
    company.timezone = "UTC";
    touched.add("timezone");
  }

  return [...touched];
};

export const calculateCompanyProfileCompletion = (company = {}) => {
  const checks = [
    company.image,
    company.cover_image,
    company.company_name,
    company.slug,
    company.company_email,
    company.created_year,
    company.description,
    company.industry_id || company.industry_name,
    company.company_size,
    company.company_size_type && company.company_size_type !== "unknown",
    company.company_type,
    company.country_id || company.company_country,
    company.city_id || company.company_city,
    company.company_address,
    company.company_phone,
    company.company_phone_code,
    company.company_website,
    company.hr_name,
    company.hr_email,
    company.hr_phone,
    company.specialties,
    company.benefits,
    company.social_links,
    hasLocation(company),
  ];

  const done = checks.filter(hasValue).length;
  return Math.round((done / checks.length) * 100);
};

export const buildCompanyMissingItems = (company = {}) => {
  const missing = [];

  const push = (key, title, description, priority = "medium", action = null) => {
    missing.push({ key, title, description, priority, action });
  };

  if (!hasText(company.company_name))
    push("company_name", "company_name_missing", "add_company_name", "high", "profile");

  if (!hasText(company.slug))
    push("slug", "company_slug_missing", "add_company_public_slug", "medium", "profile");

  if (!hasText(company.company_email))
    push("company_email", "company_email_missing", "add_company_email", "high", "contact");

  if (!hasText(company.logo))
    push("logo", "company_logo_missing", "add_company_logo", "high", "media");
  if (!hasText(company.cover_image))
    push("cover_image", "company_cover_missing", "add_company_cover_image", "medium", "media");

  if (!hasText(company.description))
    push("description", "company_description_missing", "write_company_description", "high", "profile");

  if (!company.industry_id && !hasText(company.industry_name))
    push("industry", "company_industry_missing", "select_company_industry", "high", "profile");

  if (!company.company_size)
    push("company_size", "company_size_missing", "add_company_size", "medium", "profile");

  if (!company.company_size_type || company.company_size_type === "unknown")
    push("company_size_type", "company_size_type_missing", "select_company_size_type", "medium", "profile");

  if (!hasText(company.company_type))
    push("company_type", "company_type_missing", "add_company_type", "medium", "profile");

  if (!company.country_id && !hasText(company.company_country))
    push("country_id", "company_country_missing", "select_company_country", "high", "location");

  if (!company.city_id && !hasText(company.company_city))
    push("city_id", "company_city_missing", "select_company_city", "medium", "location");

  if (!hasText(company.company_address))
    push("company_address", "company_address_missing", "add_company_address", "medium", "location");

  if (!hasText(company.company_phone))
    push("company_phone", "company_phone_missing", "add_company_phone", "high", "contact");

  if (!hasText(company.company_website))
    push("company_website", "company_website_missing", "add_company_website", "low", "contact");

  if (!hasText(company.hr_name) || !hasText(company.hr_email))
    push("hr_contact", "hr_contact_missing", "add_hr_contact_information", "high", "contact");

  if (!hasArray(company.specialties))
    push("specialties", "company_specialties_missing", "add_company_specialties", "medium", "profile");

  if (!hasArray(company.benefits))
    push("benefits", "company_benefits_missing", "add_company_benefits", "low", "profile");

  if (!hasArray(company.social_links))
    push("social_links", "company_social_links_missing", "add_company_social_links", "low", "social_links");

  return missing;
};

export const buildCompanyProfileStrength = (completion, missingItems) => {
  const highMissing = missingItems.filter((item) => item.priority === "high").length;

  let level = "weak";
  let message = "company_profile_needs_completion";

  if (completion >= 85 && highMissing === 0) {
    level = "excellent";
    message = "company_profile_is_excellent";
  } else if (completion >= 65) {
    level = "good";
    message = "company_profile_is_good";
  } else if (completion >= 40) {
    level = "medium";
    message = "company_profile_is_medium";
  }

  return {
    level,
    message,
    completion,
    high_missing_count: highMissing,
    missing_count: missingItems.length,
  };
};

export const buildCompanyDashboardQuickActions = (missingItems = []) => {
  const actions = [];

  if (missingItems.some((item) => item.action === "media")) {
    actions.push({
      key: "update_company_media",
      title: "update_company_media",
      description: "add_logo_and_cover_to_build_trust",
      action: "media",
      priority: "high",
    });
  }

  if (missingItems.some((item) => item.action === "profile")) {
    actions.push({
      key: "complete_company_profile",
      title: "complete_company_profile",
      description: "complete_company_information_to_improve_visibility",
      action: "profile",
      priority: "high",
    });
  }

  if (missingItems.some((item) => item.action === "contact")) {
    actions.push({
      key: "complete_company_contact",
      title: "complete_company_contact",
      description: "add_company_and_hr_contact_information",
      action: "contact",
      priority: "high",
    });
  }

  actions.push({
    key: "post_job",
    title: "post_new_job",
    description: "start_hiring_by_posting_a_job",
    action: "jobs",
    priority: "medium",
  });

  return actions;
};

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

const toId = (value) => String(value?._id || value || "");

export const rebuildCompanySearchFilters = async (company) => {
  let country = null;
  let city = null;

  if (company.country_id && mongoose.Types.ObjectId.isValid(toId(company.country_id))) {
    country = await CountryModel.findById(company.country_id).lean();
  }

  if (company.city_id && mongoose.Types.ObjectId.isValid(toId(company.city_id))) {
    city = await CountryModel.findById(company.city_id).lean();
  }

  const socialTokens = buildTokens((company.social_links || []).map((x) => [x.type, x.url]));

  const profileTokens = buildTokens(
    company.company_name,
    company.slug,
    company.company_email,
    company.description,
    company.mission,
    company.vision,
    company.culture,
    company.industry_name,
    company.company_type,
    company.company_country,
    company.company_city,
    company.company_address,
    company.company_website,
    company.hr_name,
    company.hr_email,
    company.specialties,
    company.benefits,
    company.languages,
    country
      ? [
        country.country_code,
        country.country_name_ar,
        country.country_name_en,
        country.city_name_ar,
        country.city_name_en,
      ]
      : [],
    city
      ? [
        city.country_code,
        city.country_name_ar,
        city.country_name_en,
        city.city_name_ar,
        city.city_name_en,
      ]
      : [],
    socialTokens
  );

  company.search_filters = {
    text: {
      profile: profileTokens,
      all: profileTokens,
    },
    identity: {
      company_name: company.company_name || "",
      slug: company.slug || "",
      industry_id:
        company.industry_id && mongoose.Types.ObjectId.isValid(toId(company.industry_id))
          ? company.industry_id
          : null,
      industry_name: company.industry_name || "",
      company_type: company.company_type || "",
      company_size_type: company.company_size_type || "unknown",
      specialties: uniqueClean(company.specialties || []),
      benefits: uniqueClean(company.benefits || []),
    },
    location: {
      country_id:
        company.country_id && mongoose.Types.ObjectId.isValid(toId(company.country_id))
          ? company.country_id
          : null,
      city_id:
        company.city_id && mongoose.Types.ObjectId.isValid(toId(company.city_id))
          ? company.city_id
          : null,
      country_code: String(country?.country_code || city?.country_code || "").toUpperCase(),
      country_name_ar: country?.country_name_ar || city?.country_name_ar || "",
      country_name_en: country?.country_name_en || city?.country_name_en || "",
      city_name_ar: city?.city_name_ar || country?.city_name_ar || "",
      city_name_en: city?.city_name_en || country?.city_name_en || "",
      company_country: company.company_country || "",
      company_city: company.company_city || "",
      timezone: company.timezone || "UTC",
    },
    hiring: {
      is_hiring: Boolean(company.is_hiring),
      can_upload: Boolean(company.can_upload),
      free_post_balance: Number(company.free_post_balance || 0),
      jobs_count: Number(company.jobs_count || 0),
      active_jobs_count: Number(company.active_jobs_count || 0),
    },
    trust: {
      status: Boolean(company.status),
      accepted: Boolean(company.accepted),
      is_verified: Boolean(company.is_verified),
      rating_avg: Number(company.rating_avg || 0),
      rating_count: Number(company.rating_count || 0),
      profile_completion: Number(company.profile_completion || 0),
    },
    stats: {
      employees_count: Number(company.employees_count || 0),
      views_count: Number(company.views_count || 0),
      followers_count: Number(company.followers_count || 0),
    },
  };
};

export const COMPANY_SEARCH_FILTER_RELATED_FIELDS = new Set([
  "logo",
  "company_name",
  "slug",
  "company_email",
  "description",
  "mission",
  "vision",
  "culture",
  "industry_id",
  "industry_name",
  "company_size",
  "company_size_type",
  "company_type",
  "country_id",
  "city_id",
  "company_country",
  "company_city",
  "company_address",
  "timezone",
  "company_website",
  "hr_name",
  "hr_email",
  "specialties",
  "benefits",
  "languages",
  "social_links",
  "is_hiring",
  "can_upload",
  "free_post_balance",
  "jobs_count",
  "active_jobs_count",
  "employees_count",
  "views_count",
  "followers_count",
  "status",
  "accepted",
  "is_verified",
  "rating_avg",
  "rating_count",
  "profile_completion",
  "image",
  "cover_image",
  "gallery",
]);

export const shouldRebuildCompanySearchFilters = (fields = []) =>
  fields.some((field) => COMPANY_SEARCH_FILTER_RELATED_FIELDS.has(field));

export const applyCompletionAndSearchFilters = async (company, touchedFields = []) => {
  const finalTouchedFields = await applyCompanyAutoFields(company, touchedFields);

  company.profile_completion = calculateCompanyProfileCompletion(company);
  finalTouchedFields.push("profile_completion");

  if (shouldRebuildCompanySearchFilters(finalTouchedFields)) {
    await rebuildCompanySearchFilters(company);
  }

  return finalTouchedFields;
};

export const paginate = async (Model, filter = {}, req, options = {}) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(
    Math.max(Number(req.query.limit || req.query.paginate) || 10, 1),
    100
  );
  const skip = (page - 1) * limit;
  const sort = options.sort || parseSort(req.query.sort) || { createdAt: -1, _id: -1 };

  let query = Model.find(filter).sort(sort).skip(skip).limit(limit);

  if (options.select) query = query.select(options.select);
  if (options.populate) query = query.populate(options.populate);
  if (options.lean !== false) query = query.lean();

  const [items, total] = await Promise.all([
    query,
    Model.countDocuments(filter),
  ]);

  return {
    items,
    meta: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      has_next: page * limit < total,
      has_prev: page > 1,
    },
  };
};

const parseSort = (sortValue) => {
  if (!sortValue) return null;

  const value = String(sortValue).trim();
  if (!value) return null;

  const direction = value.startsWith("-") ? -1 : 1;
  const field = value.replace(/^-/, "");

  return { [field]: direction, _id: direction };
};

export const normalizeCompany = (company) => {
  if (!company) return null;

  return {
    _id: company._id,
    company_name: company.company_name || "",
    slug: company.slug || "",
    logo: company.logo || null,
    image: company.logo || company.image || null,
    cover_image: company.cover_image || null,
    industry_name: company.industry_name || "",
    country: company.company_country || "",
    city: company.company_city || "",
    is_verified: Boolean(company.is_verified),
    rating_avg: company.rating_avg || 0,
    rating_count: company.rating_count || 0,
  };
};

export const normalizeJob = (job) => {
  if (!job) return null;

  return {
    _id: job._id,
    job_name_id: job.job_name_id || null,
    job_name: job.job_name || "",
    description: job.description || "",
    ref: job.ref || "",
    company: normalizeCompany(job.company_id),

    countries: job.countries || [],
    cities: job.cities || [],
    city: job.city || "",
    address: job.address || "",

    work_mode: job.work_mode_info || job.work_mode_id || null,
    work_mode_id: job.work_mode_id || null,
    job_type: job.job_type_info || job.job_type_id || null,
    job_type_id: job.job_type_id || null,
    job_time: job.job_time_info || job.job_time_id || null,
    job_time_id: job.job_time_id || null,
    job_salary: job.job_salary_info || job.job_salary_id || null,
    job_salary_id: job.job_salary_id || null,

    salary: job.salary || null,
    experience_level: job.experience_level_info || job.experience_level_id || null,
    experience_level_id: job.experience_level_id || null,
    education_level: job.education_level_info || job.education_level_id || null,
    education_level_id: job.education_level_id || null,
    min_experience_years: job.min_experience_years ?? 0,
    max_experience_years: job.max_experience_years ?? null,

    candidate_target: job.candidate_target || [],
    is_for_students: Boolean(job.is_for_students),
    is_for_graduates: Boolean(job.is_for_graduates),
    is_for_fresh_graduates: Boolean(job.is_for_fresh_graduates),

    skills_required: job.skills_required || [],
    skills_optional: job.skills_optional || [],
    languages: job.languages || [],
    job_services: job.job_services || [],
    services: job.job_services || [],
    questions: job.questions || [],

    is_remote: Boolean(job.is_remote),
    show_company_information: job.show_company_information !== false,
    is_cv_required: job.is_cv_required !== false,
    is_send_emails: Boolean(job.is_send_emails),
    is_contact_on_emails: Boolean(job.is_contact_on_emails),
    emails: job.emails || [],
    is_out_side: Boolean(job.is_out_side),
    out_link: job.out_link || "",

    publish_status: job.publish_status || "published",
    status: Boolean(job.status),
    is_accepted: Boolean(job.is_accepted),
    started_date: job.started_date || null,
    end_date: job.end_date || null,
    apply_deadline: job.apply_deadline || null,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,

    search_index: job.search_index || null,
    search_projection: job.search_projection || null,

    stats: {
      views: job.user_show || 0,
      reviews: job.user_review || 0,
      applications: job.user_applying || 0,
      out_side_applications: job.out_side_applying || 0,
      saved: job.user_saved || 0,
      rating: job.rating || 0,
    },
  };
};

export const normalizeApplication = (application) => ({
  _id: application._id,
  status: application.status,
  status_changed_at: application.status_changed_at,
  applied_at: application.createdAt,
  first_name: application.first_name,
  last_name: application.last_name,
  email: application.email,
  phone_code: application.phone_code,
  phone_national: application.phone_national,
  has_application_cv: Boolean(application.cv),
  has_cv: Boolean(application.cv || application.employee_id?.cvs?.some?.((cv) => !cv.status || cv.status === "active")),
  cv_download: Boolean(application.cv_download),
  cover_letter: application.cover_letter,
  answers: application.answers || [],
  country_id: application.country_id || null,
  source: application.source || "app",
  job: normalizeJob(application.job_id),
  employee: application.employee_id || null,
  user: application.user_id || null,
  filter: {
    is_filter: application.is_filter,
    score: application.filter_result?.score ?? null,
    matched_skills: application.filter_result?.matched_skills || [],
    missing_skills: application.filter_result?.missing_skills || [],
    reason: application.filter_result?.reason || "",
  },
});

export const normalizeInterview = (interview) => ({
  _id: interview._id,
  status: interview.status,
  type: interview.type,
  start_at: interview.start_at,
  end_at: interview.end_at,
  timezone: interview.timezone,
  meet_link: interview.meet_link,
  office_address: interview.office_address,
  company_note: interview.company_note,
  candidate_note: interview.candidate_note,
  result_note: interview.result_note || "",
  rating: interview.rating ?? null,
  reschedule_count: interview.reschedule_count || 0,
  job: normalizeJob(interview.job_id),
  application: interview.application_id || null,
  employee_user_id: interview.employee_user_id || null,
});

export const getCompanyStats = async (companyId) => {
  const [jobs, activeJobs, applications, interviews, reviews] = await Promise.all([
    jobsModel.countDocuments({ company_id: companyId }),

    jobsModel.countDocuments({
      company_id: companyId,
      status: true,
      publish_status: "published",
    }),

    UserApplyingJobModel.countDocuments({ company_id: companyId }),

    InterviewModel.countDocuments({
      company_id: companyId,
      status: { $in: ["scheduled", "rescheduled"] },
    }),

    CompanyReviewModel?.countDocuments
      ? CompanyReviewModel.countDocuments({
        company_id: companyId,
        status: "published",
      }).catch(() => 0)
      : 0,
  ]);

  return {
    jobs_count: jobs,
    active_jobs_count: activeJobs,
    applications_count: applications,
    upcoming_interviews_count: interviews,
    reviews_count: reviews,
  };
};

export const buildCompanyHiringPipeline = (rows = []) => {
  const stages = [
    { key: "waiting", title: "waiting", color: "slate" },
    { key: "screening", title: "screening", color: "blue" },
    { key: "shortlisted", title: "shortlisted", color: "indigo" },
    { key: "interview", title: "interview", color: "amber" },
    { key: "offer", title: "offer", color: "purple" },
    { key: "accepted", title: "accepted", color: "emerald" },
    { key: "hired", title: "hired", color: "emerald" },
    { key: "rejected", title: "rejected", color: "rose" },
    { key: "withdrawn", title: "withdrawn", color: "slate" },
    { key: "auto_cancel", title: "auto_cancel", color: "slate" },
  ];

  const counts = rows.reduce((acc, row) => {
    acc[row?._id || "unknown"] = Number(row?.count || 0);
    return acc;
  }, {});

  const items = stages.map((stage) => ({
    ...stage,
    count: counts[stage.key] || 0,
  }));

  const activeKeys = new Set(["waiting", "screening", "shortlisted", "interview", "offer"]);
  const successKeys = new Set(["accepted", "hired"]);
  const closedKeys = new Set(["rejected", "withdrawn", "auto_cancel"]);

  return {
    items,
    total: items.reduce((sum, item) => sum + item.count, 0),
    active: items.filter((item) => activeKeys.has(item.key)).reduce((sum, item) => sum + item.count, 0),
    successful: items.filter((item) => successKeys.has(item.key)).reduce((sum, item) => sum + item.count, 0),
    closed: items.filter((item) => closedKeys.has(item.key)).reduce((sum, item) => sum + item.count, 0),
    counts,
  };
};

export const buildCompanyDashboardStats = ({
  baseStats = {},
  latestApplications = [],
  latestJobs = [],
  upcomingInterviews = [],
  pipeline = null,
  smartCandidates = [],
  recentInvitations = [],
}) => {
  const counts = pipeline?.counts || {};

  return {
    jobs_count: baseStats.jobs_count || 0,
    active_jobs_count: baseStats.active_jobs_count || 0,
    applications_count: baseStats.applications_count || 0,
    upcoming_interviews_count: baseStats.upcoming_interviews_count || 0,
    reviews_count: baseStats.reviews_count || 0,
    latest_applications_count: latestApplications.length,
    latest_jobs_count: latestJobs.length,
    upcoming_interviews_preview_count: upcomingInterviews.length,
    smart_candidates_count: smartCandidates.length,
    recent_invitations_count: recentInvitations.length,
    waiting_applications: counts.waiting ?? latestApplications.filter((item) => item.status === "waiting").length,
    screening_applications: counts.screening || 0,
    shortlisted_applications: counts.shortlisted || 0,
    interview_applications: counts.interview ?? latestApplications.filter((item) => item.status === "interview").length,
    offer_applications: counts.offer || 0,
    rejected_applications: counts.rejected ?? latestApplications.filter((item) => item.status === "rejected").length,
    accepted_applications: (counts.accepted || 0) + (counts.hired || 0),
    active_pipeline_count: pipeline?.active || 0,
    successful_pipeline_count: pipeline?.successful || 0,
  };
};

const safeNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const percentage = (part, total) => {
  const finalTotal = safeNumber(total);
  if (!finalTotal) return 0;
  return Math.round((safeNumber(part) / finalTotal) * 100);
};

export const buildCompanyPerformanceSummary = ({ latestJobs = [], baseStats = {} }) => {
  const totals = latestJobs.reduce(
    (acc, job) => {
      acc.views += safeNumber(job.user_show);
      acc.saved += safeNumber(job.user_saved);
      acc.applications += safeNumber(job.user_applying);
      acc.reviews += safeNumber(job.user_review);
      acc.outsideApplications += safeNumber(job.out_side_applying);
      return acc;
    },
    { views: 0, saved: 0, applications: 0, reviews: 0, outsideApplications: 0 }
  );

  const mostActiveJob = [...latestJobs]
    .sort((a, b) => safeNumber(b.user_applying) - safeNumber(a.user_applying))[0];

  return {
    ...totals,
    total_jobs: baseStats.jobs_count || latestJobs.length || 0,
    active_jobs: baseStats.active_jobs_count || 0,
    application_conversion_rate: percentage(totals.applications, totals.views),
    save_rate: percentage(totals.saved, totals.views),
    most_active_job: mostActiveJob
      ? {
          _id: mostActiveJob._id,
          job_name: mostActiveJob.job_name || "",
          applications: safeNumber(mostActiveJob.user_applying),
          views: safeNumber(mostActiveJob.user_show),
          saved: safeNumber(mostActiveJob.user_saved),
        }
      : null,
  };
};

export const buildCompanyReviewsSummary = ({ aggregation = null, latestReviews = [] } = {}) => {
  const count = safeNumber(aggregation?.count);
  const average = count ? Number(safeNumber(aggregation?.average).toFixed(1)) : 0;

  return {
    count,
    average,
    distribution: {
      5: safeNumber(aggregation?.five),
      4: safeNumber(aggregation?.four),
      3: safeNumber(aggregation?.three),
      2: safeNumber(aggregation?.two),
      1: safeNumber(aggregation?.one),
    },
    latest: latestReviews.map((review) => ({
      _id: review._id,
      rating: review.rating || 0,
      message: review.message || "",
      status: review.status || "published",
      user: review.is_anonymous ? null : review.user_id || null,
      createdAt: review.createdAt,
    })),
  };
};

export const normalizeCompanyDashboardCandidate = (match) => {
  if (!match) return null;

  const employee = match.employee_id || null;
  const user = match.user_id || employee?.user_id || null;
  const name = [user?.first_name, user?.mid_name, user?.last_name]
    .map((x) => String(x || "").trim())
    .filter(Boolean)
    .join(" ");

  return {
    _id: match._id,
    score: Math.round(safeNumber(match.score)),
    breakdown: match.breakdown || {},
    matched_skills: match.matched_skills || [],
    missing_skills: match.missing_skills || [],
    matched_languages: match.matched_languages || [],
    missing_languages: match.missing_languages || [],
    generated_at: match.generated_at || null,
    job: normalizeJob(match.job_id),
    candidate: {
      employee_id: employee?._id || null,
      user_id: user?._id || match.user_id || null,
      name,
      first_name: user?.first_name || "",
      last_name: user?.last_name || "",
      email: user?.email || "",
      image: user?.image || null,
      phone_code: user?.phone_code || "",
      phone_national: user?.phone_national || "",
      profile_headline: employee?.profile_headline || "",
      current_job_title: employee?.current_job_title || "",
      experience_years: employee?.experience_years || 0,
      profile_completion: employee?.profile_completion || 0,
      is_free_for_work: Boolean(employee?.is_free_for_work),
      skills: employee?.skills || [],
      languages: employee?.languages || [],
      experience_level: employee?.experience_level_id || null,
    },
  };
};

export const normalizeCompanyDashboardInvitation = (invitation) => {
  if (!invitation) return null;

  const employee = invitation.employee_id || null;
  const user = invitation.user_id || employee?.user_id || null;
  const name = [user?.first_name, user?.mid_name, user?.last_name]
    .map((x) => String(x || "").trim())
    .filter(Boolean)
    .join(" ");

  return {
    _id: invitation._id,
    status: invitation.status || "sent",
    message: invitation.message || "",
    expires_at: invitation.expires_at || null,
    responded_at: invitation.responded_at || null,
    createdAt: invitation.createdAt,
    updatedAt: invitation.updatedAt,
    job: normalizeJob(invitation.job_id),
    candidate: {
      employee_id: employee?._id || null,
      user_id: user?._id || invitation.user_id || null,
      name,
      first_name: user?.first_name || "",
      last_name: user?.last_name || "",
      image: user?.image || null,
      email: user?.email || "",
    },
  };
};


export const escapeRegex = (value = "") =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");


export const buildJobSearchFilter = (search = "") => {
  const normalized = normalizeSearchToken(search);

  if (!normalized) return {};

  const tokens = normalized.split(/\s+/).filter(Boolean);
  const regex = new RegExp(escapeRegex(normalized), "i");

  return {
    $or: [
      { job_name: regex },
      { description: regex },

      { "search_index.title_norm": regex },
      { "search_index.description_norm": regex },
      { "search_index.text_norm": regex },

      { "search_index.tokens": { $in: tokens } },
      { "search_index.phrases": regex },
      { "search_index.aliases": { $in: tokens } },

      { "search_index.title_tokens": { $in: tokens } },
      { "search_index.skill_tokens": { $in: tokens } },
      { "search_index.company_tokens": { $in: tokens } },
      { "search_index.service_tokens": { $in: tokens } },
      { "search_index.country_tokens": { $in: tokens } },
      { "search_index.sector_tokens": { $in: tokens } },

      { "search_index.filters.countries": { $in: tokens } },
      { "search_index.filters.cities": { $in: tokens } },
      { "search_index.filters.city": regex },
      { "search_index.filters.job_type": regex },
      { "search_index.filters.work_time": regex },
      { "search_index.filters.work_mode": regex },
      { "search_index.filters.salary_type": regex },
      { "search_index.filters.currency": regex },
      { "search_index.filters.experience_level": regex },
      { "search_index.filters.education_level": regex },
      { "search_index.filters.languages": { $in: tokens } },
      { "search_index.filters.skills": { $in: tokens } },
      { "search_index.filters.services": { $in: tokens } },
      { "search_index.filters.candidate_target": { $in: tokens } },
    ],
  };
};


export const applyCompanyJobFilters = (baseFilter = {}, query = {}) => {
  const filter = { ...baseFilter };

  if (query.publish_status) {
    filter.publish_status = query.publish_status;
  }

  if (query.status !== undefined) {
    filter.status =
      query.status === true ||
      query.status === "true" ||
      query.status === 1 ||
      query.status === "1";
  }

  if (query.is_accepted !== undefined) {
    filter.is_accepted =
      query.is_accepted === true ||
      query.is_accepted === "true" ||
      query.is_accepted === 1 ||
      query.is_accepted === "1";
  }

  if (query.work_mode_id) {
    filter.work_mode_id = query.work_mode_id;
  }

  if (query.job_type_id) {
    filter.job_type_id = query.job_type_id;
  }

  if (query.job_time_id) {
    filter.job_time_id = query.job_time_id;
  }

  if (query.education_level_id) {
    filter.education_level_id = query.education_level_id;
  }

  if (query.experience_level_id) {
    filter.experience_level_id = query.experience_level_id;
  }

  if (query.city) {
    filter.city = {
      $regex: query.city,
      $options: "i",
    };
  }

  return filter;
};