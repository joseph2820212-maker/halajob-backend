import dotenv from "dotenv";

import {
  UserModel,
  CompanyModel,
  EmployeeModel,
  CountryModel,
  CurrencyModel,
  SkillModel,
  LanguageModel,
  ExperienceLevelModel,
  EducationLevelModel,
  WorkModeModel,
  WorkTimeTypeModel,
  JobTypeModel,
  JobSalaryModel,
  JobNameModel,
  jobsModel,
  UserApplyingJobModel,
} from "../models/index.js";

/**
 * Seed jobs + applications using EXISTING companies and EXISTING employees only.
 *
 * هذا الإصدار مطابق للـ models المرسلة:
 * - JobModel يحتاج job_name كنص + job_name_id كارتباط.
 * - skills_required / skills_optional تحتاج skill_id + title.
 * - languages تحتاج language_id + name.
 * - salary تحتاج currency_id + currency_code + currency_rate_snapshot.
 * - JobModel لا يحتوي country_id، لذلك countries/cities تبقى Strings حسب الـ schema الحالي.
 * - يتم الحفظ عبر save/create حتى تعمل pre("validate") الموجودة في JobModel وتُبنى search_index.
 */

dotenv.config();

const JOBS_COUNT = Number(process.env.SEED_JOBS_COUNT || 100);
const EXISTING_COMPANIES_LIMIT = Number(process.env.SEED_EXISTING_COMPANIES_LIMIT || 100);
const EXISTING_EMPLOYEES_LIMIT = Number(process.env.SEED_EXISTING_EMPLOYEES_LIMIT || 300);
const APPLICATIONS_MIN_PER_JOB = Number(process.env.SEED_APPLICATIONS_MIN_PER_JOB || 3);
const APPLICATIONS_MAX_PER_JOB = Number(process.env.SEED_APPLICATIONS_MAX_PER_JOB || 9);

const JOB_END_MIN_DAYS = Number(process.env.SEED_JOB_END_MIN_DAYS || 365);
const JOB_END_MAX_DAYS = Number(process.env.SEED_JOB_END_MAX_DAYS || 730);
const JOB_APPLY_DEADLINE_GAP_MIN_DAYS = Number(process.env.SEED_JOB_APPLY_DEADLINE_GAP_MIN_DAYS || 15);
const JOB_APPLY_DEADLINE_GAP_MAX_DAYS = Number(process.env.SEED_JOB_APPLY_DEADLINE_GAP_MAX_DAYS || 45);

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[rand(0, arr.length - 1)];
const sample = (arr, count) =>
  [...arr]
    .sort(() => 0.5 - Math.random())
    .slice(0, Math.min(count, arr.length));

const addDays = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
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
  uniqueClean(groups)
    .map(normalizeSearchToken)
    .filter(Boolean);

const toIdString = (value) => String(value?._id || value || "").trim();

const titleOf = (doc = {}) =>
  String(doc.title_en || doc.title_ar || doc.title || doc.name || doc.key || "").trim();

const lookupSnapshot = (doc = {}) => ({
  id: doc._id,
  key: doc.key || doc.name || "",
  name: doc.name || doc.key || "",
  title_ar: doc.title_ar || doc.name_ar || doc.title_en || doc.name || doc.key || "",
  title_en: doc.title_en || doc.name_en || doc.title_ar || doc.name || doc.key || "",
});

const isRemoteWorkMode = (workMode = {}) => {
  const value = String(workMode.key || workMode.name || workMode.title_en || "").toLowerCase().trim();
  return value === "remote" || value.includes("remote");
};

const levelText = (level) => {
  const levels = {
    1: "beginner",
    2: "basic",
    3: "intermediate",
    4: "advanced",
    5: "expert",
  };
  return levels[level] || "intermediate";
};

const countryValues = (country = {}) =>
  uniqueClean([country.country_code, country.country_name_ar, country.country_name_en]);

const cityValues = (country = {}, company = {}) =>
  uniqueClean([company.company_city, country.city_name_ar, country.city_name_en]);

const getPrimaryCity = (country = {}, company = {}) =>
  String(company.company_city || country.city_name_en || country.city_name_ar || "").trim();

const getCompanyCountry = (country = {}, company = {}) =>
  String(company.company_country || country.country_name_en || country.country_name_ar || country.country_code || "").trim();

const getCountryIdForApplication = (employeePack, companyPack, fallbackCountry) =>
  employeePack?.employee?.preferred_countries?.[0] ||
  companyPack?.company?.country_id ||
  companyPack?.company?.city_id ||
  fallbackCountry?._id ||
  null;

async function getExistingDocs(
  Model,
  label,
  { min = 1, limit = 300, sort = { sort_order: 1, createdAt: 1 } } = {}
) {
  const docs = await Model.find({
    $or: [{ is_active: { $exists: false } }, { is_active: { $ne: false } }],
  })
    .sort(sort)
    .limit(limit)
    .lean();

  if (docs.length < min) {
    throw new Error(
      `Missing required lookup data: ${label}. Found ${docs.length}, expected at least ${min}. ` +
        `Please run the related seeder for ${label} before seedJobsAndApplications.`
    );
  }

  return docs;
}

async function deletePreviousSeedData() {
  const seedJobs = await jobsModel.find({ ref: /^SEED-JOB-/ }).select("_id").lean();
  const seedJobIds = seedJobs.map((job) => job._id);

  const applicationsDeleteResult = seedJobIds.length
    ? await UserApplyingJobModel.deleteMany({ job_id: { $in: seedJobIds } })
    : { deletedCount: 0 };

  const jobsDeleteResult = await jobsModel.deleteMany({ ref: /^SEED-JOB-/ });

  const seedCompanyUsers = await UserModel.find({ email: /^seed\.company\.\d+@jobzain\.test$/ })
    .select("_id")
    .lean();
  const seedEmployeeUsers = await UserModel.find({ email: /^seed\.employee\.\d+@jobzain\.test$/ })
    .select("_id")
    .lean();

  const seedCompanyUserIds = seedCompanyUsers.map((user) => user._id);
  const seedEmployeeUserIds = seedEmployeeUsers.map((user) => user._id);

  const companiesDeleteResult = await CompanyModel.deleteMany({
    $or: [
      { company_email: /^hr\.\d+@jobzain\.test$/ },
      ...(seedCompanyUserIds.length ? [{ owner_user_id: { $in: seedCompanyUserIds } }] : []),
    ],
  });

  const oldSeedEmployeesDeleteResult = seedEmployeeUserIds.length
    ? await EmployeeModel.deleteMany({ user_id: { $in: seedEmployeeUserIds } })
    : { deletedCount: 0 };

  const usersDeleteResult = await UserModel.deleteMany({
    $or: [
      { email: /^seed\.company\.\d+@jobzain\.test$/ },
      { email: /^seed\.employee\.\d+@jobzain\.test$/ },
    ],
  });

  return {
    applications: applicationsDeleteResult.deletedCount || 0,
    jobs: jobsDeleteResult.deletedCount || 0,
    oldSeedCompanies: companiesDeleteResult.deletedCount || 0,
    oldSeedEmployees: oldSeedEmployeesDeleteResult.deletedCount || 0,
    oldSeedUsers: usersDeleteResult.deletedCount || 0,
  };
}

async function loadExistingJobData() {
  const [
    countries,
    currencies,
    workModes,
    jobTypes,
    workTimes,
    salaryTypes,
    experienceLevels,
    educationLevels,
    skills,
    languages,
    jobNames,
  ] = await Promise.all([
    getExistingDocs(CountryModel, "countries", { min: 1 }),
    getExistingDocs(CurrencyModel, "currencies", { min: 1 }),
    getExistingDocs(WorkModeModel, "work modes", { min: 1 }),
    getExistingDocs(JobTypeModel, "job types", { min: 1 }),
    getExistingDocs(WorkTimeTypeModel, "work time types", { min: 1 }),
    getExistingDocs(JobSalaryModel, "job salaries", { min: 1 }),
    getExistingDocs(ExperienceLevelModel, "experience levels", { min: 1 }),
    getExistingDocs(EducationLevelModel, "education levels", { min: 1 }),
    getExistingDocs(SkillModel, "skills", { min: 3 }),
    getExistingDocs(LanguageModel, "languages", { min: 1 }),
    getExistingDocs(JobNameModel, "job names", { min: 1 }),
  ]);

  return {
    countries,
    currencies,
    workModes,
    jobTypes,
    workTimes,
    salaryTypes,
    experienceLevels,
    educationLevels,
    skills,
    languages,
    jobNames,
  };
}

async function loadExistingCompanies({ limit = EXISTING_COMPANIES_LIMIT, min = 1 } = {}) {
  const companiesDocs = await CompanyModel.find({
    $and: [
      { company_email: { $not: /^hr\.\d+@jobzain\.test$/ } },
      { status: true },
      { accepted: true },
      { owner_user_id: { $exists: true, $ne: null } },
    ],
  })
    .sort({ is_verified: -1, createdAt: -1 })
    .limit(limit)
    .lean();

  const ownerIds = companiesDocs.map((company) => company.owner_user_id).filter(Boolean);
  const owners = await UserModel.find({
    _id: { $in: ownerIds },
    email: { $not: /^seed\.company\.\d+@jobzain\.test$/ },
    status: true,
  }).lean();

  const ownersMap = new Map(owners.map((owner) => [String(owner._id), owner]));
  const companies = companiesDocs
    .map((company) => ({ company, owner: ownersMap.get(String(company.owner_user_id)) }))
    .filter((item) => item.owner);

  if (companies.length < min) {
    throw new Error(
      `Not enough existing companies to create jobs. Found ${companies.length}, expected at least ${min}. ` +
        `Create accepted/active companies first or lower the required minimum.`
    );
  }

  return companies;
}

async function loadExistingEmployees({ limit = EXISTING_EMPLOYEES_LIMIT, min = APPLICATIONS_MIN_PER_JOB } = {}) {
  const employeesDocs = await EmployeeModel.find({
    $and: [
      { status: true },
      { accepted: true },
      { user_id: { $exists: true, $ne: null } },
    ],
  })
    .sort({ profile_completion: -1, createdAt: -1 })
    .limit(limit)
    .lean();

  const userIds = employeesDocs.map((employee) => employee.user_id).filter(Boolean);
  const users = await UserModel.find({
    _id: { $in: userIds },
    email: { $not: /^seed\.employee\.\d+@jobzain\.test$/ },
    status: true,
  }).lean();

  const usersMap = new Map(users.map((user) => [String(user._id), user]));
  const employees = employeesDocs
    .map((employee) => ({ employee, user: usersMap.get(String(employee.user_id)) }))
    .filter((item) => {
      const user = item.user;
      return Boolean(user?.first_name && user?.last_name && user?.email && user?.phone_code && user?.phone_national);
    });

  if (employees.length < min) {
    throw new Error(
      `Not enough existing employees to create applications. Found ${employees.length}, expected at least ${min}. ` +
        `Create accepted/active employees with complete user phone data first or lower SEED_APPLICATIONS_MIN_PER_JOB.`
    );
  }

  return employees;
}

function buildJobPayload(i, base, companyPack) {
  const jobName = base.jobNames[i % base.jobNames.length];
  const workMode = base.workModes[i % base.workModes.length];
  const jobType = base.jobTypes[i % base.jobTypes.length];
  const workTime = base.workTimes[i % base.workTimes.length];
  const salaryType = base.salaryTypes[i % base.salaryTypes.length];
  const experience = base.experienceLevels[i % base.experienceLevels.length];
  const education = base.educationLevels[i % base.educationLevels.length];
  const currency = base.currencies[i % base.currencies.length];
  const country = base.countries[i % base.countries.length];

  const requiredSkills = sample(base.skills, rand(3, 5));
  const optionalSkills = sample(
    base.skills.filter((s) => !requiredSkills.some((r) => String(r._id) === String(s._id))),
    rand(1, 3)
  );
  const selectedLanguages = sample(base.languages, rand(1, 3));

  const minSalary = rand(700, 6000);
  const maxSalary = minSalary + rand(500, 4000);
  const minExp = rand(0, 5);
  const maxExp = minExp + rand(1, 6);

  const company = companyPack.company;
  const companyName = company.company_name || "Company";
  const jobTitle = titleOf(jobName) || `Job ${i + 1}`;

  const countries = countryValues(country);
  const cities = cityValues(country, company);
  const city = getPrimaryCity(country, company);
  const isRemote = isRemoteWorkMode(workMode);
  const candidateTarget = pick([
    ["all"],
    ["students"],
    ["graduates"],
    ["fresh_graduates"],
    ["experienced"],
    ["career_changers"],
  ]);

  const requiredSkillPayload = requiredSkills.map((skill) => ({
    skill_id: skill._id,
    title: titleOf(skill) || skill.key,
    level: rand(2, 5),
    years: rand(0, 5),
  }));

  const optionalSkillPayload = optionalSkills.map((skill) => ({
    skill_id: skill._id,
    title: titleOf(skill) || skill.key,
    level: rand(1, 4),
    years: rand(0, 3),
  }));

  const languagePayload = selectedLanguages.map((language) => {
    const level = rand(2, 5);
    return {
      language_id: language._id,
      name: language.name || titleOf(language),
      level,
      level_text: levelText(level),
    };
  });

  const endDateDays = rand(JOB_END_MIN_DAYS, JOB_END_MAX_DAYS);
  const deadlineGapDays = rand(JOB_APPLY_DEADLINE_GAP_MIN_DAYS, JOB_APPLY_DEADLINE_GAP_MAX_DAYS);
  const applyDeadlineDays = Math.max(JOB_END_MIN_DAYS - 30, endDateDays - deadlineGapDays);

  const description =
    `We are hiring a ${jobTitle} to join ${companyName}. ` +
    "The role includes practical delivery, collaboration with team members, reporting progress, and improving product quality.";

  const workModeTitle = titleOf(workMode);
  const jobTypeTitle = titleOf(jobType);
  const workTimeTitle = titleOf(workTime);
  const salaryTypeTitle = titleOf(salaryType);
  const experienceTitle = titleOf(experience);
  const educationTitle = titleOf(education);
  const skillTitles = uniqueClean([requiredSkillPayload.map((x) => x.title), optionalSkillPayload.map((x) => x.title)]);
  const languageNames = uniqueClean(languagePayload.map((x) => x.name));
  const allTokens = buildTokens(
    jobTitle,
    jobName.keywords,
    description,
    companyName,
    skillTitles,
    languageNames,
    countries,
    cities,
    jobTypeTitle,
    workModeTitle,
    workTimeTitle,
    salaryTypeTitle,
    experienceTitle,
    educationTitle,
    candidateTarget
  );

  const currencyRateSnapshot = Number(currency.rate || 1);
  const currencyCode = String(currency.code || "USD").toUpperCase().trim();

  return {
    job_name: jobTitle,
    job_name_id: jobName._id,
    description,
    ref: `SEED-JOB-${String(i + 1).padStart(3, "0")}`,
    job_keywords: uniqueClean(jobName.keywords || []),

    status: true,
    is_accepted: true,
    publish_status: pick(["published", "published", "published", "paused"]),
    started_date: addDays(-rand(0, 7)),
    end_date: addDays(endDateDays),
    apply_deadline: addDays(applyDeadlineDays),
    vacancies_count: rand(1, 8),
    priority: rand(0, 5),

    countries,
    cities,
    city,
    address: company.company_address || `${city || "Main"} Business District`.trim(),

    work_mode_id: workMode._id,
    work_mode_info: lookupSnapshot(workMode),
    is_remote: isRemote,

    job_type_id: jobType._id,
    job_type_info: lookupSnapshot(jobType),
    job_time_id: workTime._id,
    job_time_info: lookupSnapshot(workTime),
    job_salary_id: salaryType._id,
    job_salary_info: lookupSnapshot(salaryType),

    experience_level_id: experience._id,
    experience_level_info: lookupSnapshot(experience),
    min_experience_years: minExp,
    max_experience_years: maxExp,
    education_level_id: education._id,
    education_level_info: lookupSnapshot(education),

    candidate_target: candidateTarget,
    is_for_students: candidateTarget.includes("students"),
    is_for_graduates: candidateTarget.includes("graduates"),
    is_for_fresh_graduates: candidateTarget.includes("fresh_graduates"),

    skills_required: requiredSkillPayload,
    skills_optional: optionalSkillPayload,
    languages: languagePayload,

    salary: {
      min: minSalary,
      max: maxSalary,
      currency_id: currency._id,
      currency_code: currencyCode,
      currency_rate_snapshot: currencyRateSnapshot > 0 ? currencyRateSnapshot : 1,
      is_visible: Math.random() > 0.15,
      is_negotiable: Math.random() > 0.55,
    },

    job_services: [],
    show_company_information: true,
    is_send_emails: false,
    emails: undefined,
    is_cv_required: Math.random() > 0.1,
    is_contact_on_emails: false,
    is_out_side: false,
    out_link: "",

    user_show: rand(0, 600),
    user_review: rand(0, 80),
    user_applying: 0,
    out_side_applying: 0,
    user_saved: rand(0, 150),
    rating: Number((Math.random() * 2 + 3).toFixed(1)),

    questions: [
      { question: "Why are you interested in this job?", type: "textarea", is_required: true },
      { question: "How many years of relevant experience do you have?", type: "number", is_required: true },
      {
        question: "Are you available to start within 30 days?",
        type: "yes_no",
        is_required: false,
        options: [{ label: "Yes" }, { label: "No" }],
      },
    ],

    company_id: company._id,
    user_id: companyPack.owner._id,

    search_projection: {
      company: {
        id: company._id,
        name: companyName,
        logo: company.logo || company.image || null,
        industry_name: company.industry_name || "",
        company_size_type: company.company_size_type || "unknown",
        company_type: company.company_type || "",
        country: getCompanyCountry(country, company),
        city,
        verified: Boolean(company.is_verified),
        rating: Number(company.rating_avg || 0),
        active_jobs_count: Number(company.active_jobs_count || 0),
      },
      requirements: {
        skills: skillTitles,
        languages: languageNames,
        countries,
        work_mode: workModeTitle,
        job_type: jobTypeTitle,
        work_time: workTimeTitle,
        experience_level: experienceTitle,
        education_level: educationTitle,
        min_experience_years: minExp,
        max_experience_years: maxExp,
        salary_min_usd: currencyRateSnapshot > 0 ? minSalary / currencyRateSnapshot : minSalary,
        salary_max_usd: currencyRateSnapshot > 0 ? maxSalary / currencyRateSnapshot : maxSalary,
        candidate_target: candidateTarget,
        is_remote: isRemote,
      },
      ranking: {
        quality_score: rand(60, 95),
        freshness_score: rand(70, 100),
        popularity_score: rand(10, 80),
        company_score: Boolean(company.is_verified) ? rand(70, 100) : rand(40, 75),
        total_score: rand(55, 98),
      },
      matching: {
        tokens: allTokens,
        text: allTokens.join(" "),
        normalized_skills: buildTokens(skillTitles),
        normalized_titles: buildTokens(jobTitle, jobName.title_ar, jobName.title_en, jobName.keywords),
      },
    },
  };
}

async function createJobs(base, companies, jobsCount = JOBS_COUNT) {
  const jobs = [];

  for (let i = 0; i < jobsCount; i++) {
    const companyPack = companies[i % companies.length];
    const payload = buildJobPayload(i, base, companyPack);

    let job = await jobsModel.findOne({ ref: payload.ref });

    if (job) {
      job.set(payload);
      await job.save();
    } else {
      job = await jobsModel.create(payload);
    }

    jobs.push(job);
  }

  return jobs;
}

function buildApplicationPayload(job, employeePack, companyPack, fallbackCountry) {
  const user = employeePack.user;
  const employee = employeePack.employee;
  const countryId = getCountryIdForApplication(employeePack, companyPack, fallbackCountry);

  if (!countryId) {
    throw new Error(`Cannot create application for user ${user.email}: country_id is required by UserApplyingJobModel.`);
  }

  return {
    status: pick(["waiting", "waiting", "screening", "shortlisted"]),
    status_changed_at: new Date(),
    user_id: user._id,
    employee_id: employee._id,
    job_id: job._id,
    company_id: job.company_id,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    phone_code: user.phone_code,
    phone_national: user.phone_national,
    country_id: countryId,
    answers: (job.questions || []).map((question) => ({
      question_id: question._id,
      question: question.question,
      answer: question.type === "number" ? rand(0, 8) : "Seed answer generated for testing.",
    })),
    cv: employee.cvs?.find((cv) => cv.status === "active")?.url || employee.cvs?.[0]?.url || "",
    cover_letter: "Seed cover letter generated for testing.",
    user_job_rating: 0,
    is_collect_rating: false,
    cv_download: false,
    is_filter: false,
    filter_on: false,
    filter_result: {
      score: null,
      matched_skills: [],
      missing_skills: [],
      reason: "",
    },
    source: "app",
    last_activity_at: new Date(),
  };
}

async function createApplications(base, jobs, companies, employees, minPerJob, maxPerJob) {
  let totalApplications = 0;

  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];
    const companyPack = companies.find((item) => String(item.company._id) === String(job.company_id)) || companies[i % companies.length];
    const fallbackCountry = base.countries[i % base.countries.length];
    const selectedEmployees = sample(employees, rand(minPerJob, maxPerJob));

    for (const employeePack of selectedEmployees) {
      const payload = buildApplicationPayload(job, employeePack, companyPack, fallbackCountry);

      await UserApplyingJobModel.findOneAndUpdate(
        { user_id: payload.user_id, job_id: payload.job_id },
        { $set: payload },
        { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
      );
    }

    const jobApplicationsCount = await UserApplyingJobModel.countDocuments({ job_id: job._id });
    job.user_applying = jobApplicationsCount;
    await job.save();

    totalApplications += jobApplicationsCount;
  }

  return totalApplications;
}

export const seedJobsAndApplications = async ({
  jobsCount = JOBS_COUNT,
  existingCompaniesLimit = EXISTING_COMPANIES_LIMIT,
  existingEmployeesLimit = EXISTING_EMPLOYEES_LIMIT,
  applicationsMinPerJob = APPLICATIONS_MIN_PER_JOB,
  applicationsMaxPerJob = APPLICATIONS_MAX_PER_JOB,
  cleanFirst = true,
  createJobApplications = true,
} = {}) => {
  try {
    if (applicationsMinPerJob > applicationsMaxPerJob) {
      throw new Error("SEED_APPLICATIONS_MIN_PER_JOB cannot be greater than SEED_APPLICATIONS_MAX_PER_JOB.");
    }

    let deleted = null;
    if (cleanFirst) {
      console.log("🧹 Deleting previous seed jobs/applications and old fake seed data...");
      deleted = await deletePreviousSeedData();
      console.log("🧹 Previous seed data deleted:", deleted);
    }

    console.log("🌱 Loading existing job lookup data...");
    const base = await loadExistingJobData();

    console.log("🏢 Loading existing accepted/active real companies...");
    const companies = await loadExistingCompanies({
      limit: existingCompaniesLimit,
      min: 1,
    });

    let employees = [];
    if (createJobApplications) {
      console.log("👥 Loading existing accepted/active real employees...");
      employees = await loadExistingEmployees({
        limit: existingEmployeesLimit,
        min: applicationsMinPerJob,
      });
    }

    console.log(`💼 Creating/updating ${jobsCount} jobs...`);
    const jobs = await createJobs(base, companies, jobsCount);

    let applications = 0;
    if (createJobApplications) {
      console.log(`📝 Creating/updating ${applicationsMinPerJob}-${applicationsMaxPerJob} applications per job...`);
      applications = await createApplications(
        base,
        jobs,
        companies,
        employees,
        applicationsMinPerJob,
        applicationsMaxPerJob
      );
    }

    return {
      deleted,
      existingCompaniesUsed: companies.length,
      existingEmployeesUsed: employees.length,
      jobs: jobs.length,
      applications,
    };
  } catch (error) {
    console.error("❌ Jobs and applications seeder error:", error);
    throw error;
  }
};
