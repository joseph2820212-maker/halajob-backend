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
 * الاستعمال داخل master seeder:
 *   import { seedJobsAndApplications } from "./seedJobsAndApplications.js";
 *   await seedJobsAndApplications();
 *
 * مهم:
 * - لا ينشئ شركات.
 * - لا ينشئ موظفين.
 * - لا ينشئ lookup data للوظائف.
 * - يحذف أولًا بيانات السكربت السابقة فقط: jobs ref يبدأ بـ SEED-JOB، وتقديماتها، وشركات/مستخدمين seed القديمة إن وجدت.
 * - يستخدم الشركات والموظفين الحقيقيين الموجودين في قاعدة البيانات.
 * - questions فقط يتم إنشاؤها داخل الوظيفة لأنها embedded داخل JobModel.
 * - لا يعمل connect/disconnect بنفسه؛ شغّله بعد اتصال MongoDB من master seeder.
 */

dotenv.config();

const JOBS_COUNT = Number(process.env.SEED_JOBS_COUNT || 50);
const EXISTING_COMPANIES_LIMIT = Number(process.env.SEED_EXISTING_COMPANIES_LIMIT || 100);
const EXISTING_EMPLOYEES_LIMIT = Number(process.env.SEED_EXISTING_EMPLOYEES_LIMIT || 300);
const APPLICATIONS_MIN_PER_JOB = Number(process.env.SEED_APPLICATIONS_MIN_PER_JOB || 3);
const APPLICATIONS_MAX_PER_JOB = Number(process.env.SEED_APPLICATIONS_MAX_PER_JOB || 9);

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[rand(0, arr.length - 1)];
const sample = (arr, count) => [...arr].sort(() => 0.5 - Math.random()).slice(0, Math.min(count, arr.length));

const slugify = (value = "") =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0600-\u06FF]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const addDays = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
};

const titleOf = (doc = {}) =>
  String(doc.title_en || doc.title_ar || doc.title || doc.name || doc.key || "").trim();

const toInfo = (doc = {}) => ({
  id: doc._id,
  _id: doc._id,
  name: doc.name || doc.key || titleOf(doc),
  key: doc.key || doc.name || slugify(titleOf(doc)),
  title_ar: doc.title_ar || titleOf(doc),
  title_en: doc.title_en || titleOf(doc),
});

async function getExistingDocs(Model, label, { min = 1, limit = 300, sort = { sort_order: 1, createdAt: 1 } } = {}) {
  const docs = await Model.find({
    $or: [{ is_active: { $exists: false } }, { is_active: { $ne: false } }],
  })
    .sort(sort)
    .limit(limit);

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

  // تنظيف بقايا النسخ القديمة فقط، ولا يلمس الشركات أو الموظفين الحقيقيين.
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
      {
        $or: [{ status: { $exists: false } }, { status: { $ne: false } }],
      },
      {
        $or: [{ accepted: { $exists: false } }, { accepted: { $ne: false } }],
      },
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
    $or: [{ status: { $exists: false } }, { status: { $ne: false } }],
  }).lean();

  const ownersMap = new Map(owners.map((owner) => [String(owner._id), owner]));
  const companies = companiesDocs
    .map((company) => ({ company, owner: ownersMap.get(String(company.owner_user_id)) }))
    .filter((item) => item.owner);

  if (companies.length < min) {
    throw new Error(
      `Not enough existing companies to create jobs. Found ${companies.length}, expected at least ${min}. ` +
        `Create real companies first or lower the required minimum.`
    );
  }

  return companies;
}

async function loadExistingEmployees({ limit = EXISTING_EMPLOYEES_LIMIT, min = APPLICATIONS_MIN_PER_JOB } = {}) {
  const employeesDocs = await EmployeeModel.find({
    $and: [
      {
        $or: [{ status: { $exists: false } }, { status: { $ne: false } }],
      },
      {
        $or: [{ accepted: { $exists: false } }, { accepted: { $ne: false } }],
      },
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
    $or: [{ status: { $exists: false } }, { status: { $ne: false } }],
  }).lean();

  const usersMap = new Map(users.map((user) => [String(user._id), user]));
  const employees = employeesDocs
    .map((employee) => ({ employee, user: usersMap.get(String(employee.user_id)) }))
    .filter((item) => item.user);

  if (employees.length < min) {
    throw new Error(
      `Not enough existing employees to create applications. Found ${employees.length}, expected at least ${min}. ` +
        `Create real employees first or lower SEED_APPLICATIONS_MIN_PER_JOB.`
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

  const minSalary = rand(700, 6000);
  const maxSalary = minSalary + rand(500, 4000);
  const minExp = rand(0, 5);
  const maxExp = minExp + rand(1, 6);
  const title = `${titleOf(jobName)} ${i + 1}`;
  const companyName = companyPack.company.company_name || companyPack.company.name || "Company";

  return {
    job_name: title,
    job_name_id: jobName._id,
    description: `We are hiring a ${titleOf(jobName)} to join ${companyName}. The role includes practical delivery, collaboration with team members, reporting progress, and improving product quality. This seed job is generated with different salary, city, skills, work mode, and questions.`,
    ref: `SEED-JOB-${String(i + 1).padStart(3, "0")}`,
    job_keywords: [titleOf(jobName), ...requiredSkills.map(titleOf), titleOf(workMode), titleOf(jobType)],
    status: true,
    is_accepted: true,
    publish_status: pick(["published", "published", "published", "paused"]),
    started_date: addDays(-rand(0, 20)),
    end_date: addDays(rand(40, 120)),
    apply_deadline: addDays(rand(10, 45)),
    vacancies_count: rand(1, 8),
    priority: rand(0, 5),
    countries: [country.country_name_en, country.country_code].filter(Boolean),
    cities: [country.city_name_en].filter(Boolean),
    city: country.city_name_en || companyPack.company.company_city || "",
    address: `${country.city_name_en || companyPack.company.company_city || ""} Business District`.trim(),
    work_mode_id: workMode._id,
    work_mode_info: toInfo(workMode),
    is_remote: workMode.name === "remote" || workMode.key === "remote",
    job_type_id: jobType._id,
    job_type_info: toInfo(jobType),
    job_time_id: workTime._id,
    job_time_info: toInfo(workTime),
    job_salary_id: salaryType._id,
    job_salary_info: toInfo(salaryType),
    experience_level_id: experience._id,
    experience_level_info: toInfo(experience),
    min_experience_years: minExp,
    max_experience_years: maxExp,
    education_level_id: education._id,
    education_level_info: toInfo(education),
    candidate_target: pick([["all"], ["students"], ["graduates"], ["fresh_graduates"], ["experienced"], ["career_changers"]]),
    skills_required: requiredSkills.map((s) => ({ skill_id: s._id, title: titleOf(s), level: rand(2, 5), years: rand(0, 5) })),
    skills_optional: optionalSkills.map((s) => ({ skill_id: s._id, title: titleOf(s), level: rand(1, 4), years: rand(0, 3) })),
    languages: sample(base.languages, rand(1, 3)).map((l) => ({
      language_id: l._id,
      name: titleOf(l),
      level: rand(2, 5),
      level_text: pick(["Good", "Very Good", "Fluent"]),
    })),
    salary: {
      min: minSalary,
      max: maxSalary,
      currency_id: currency._id,
      currency_code: currency.code || currency.name || "USD",
      currency_rate_snapshot: currency.rate || 1,
      is_visible: Math.random() > 0.15,
      is_negotiable: Math.random() > 0.55,
    },
    show_company_information: true,
    is_send_emails: false,
    is_cv_required: Math.random() > 0.1,
    is_contact_on_emails: false,
    is_out_side: false,
    out_link: "",
    user_show: rand(0, 600),
    user_review: rand(0, 80),
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
    company_id: companyPack.company._id,
    user_id: companyPack.owner._id,
    search_projection: {
      company: {
        id: companyPack.company._id,
        name: companyName,
        logo: companyPack.company.logo || null,
        industry_name: companyPack.company.industry_name || "",
        company_size_type: companyPack.company.company_size_type || "unknown",
        company_type: companyPack.company.company_type || "",
        country: companyPack.company.company_country || country.country_name_en || "",
        city: companyPack.company.company_city || country.city_name_en || "",
        verified: companyPack.company.is_verified ?? false,
        rating: companyPack.company.rating_avg || 0,
        active_jobs_count: 0,
      },
    },
  };
}

async function createJobs(base, companies, jobsCount = JOBS_COUNT) {
  const jobs = [];

  for (let i = 0; i < jobsCount; i++) {
    const companyPack = companies[i % companies.length];
    const payload = buildJobPayload(i, base, companyPack);

    const job = await jobsModel.findOneAndUpdate(
      { ref: payload.ref },
      { $set: payload },
      { upsert: true, new: true, runValidators: true }
    );

    jobs.push(job);
  }

  return jobs;
}

function answerForQuestion(q) {
  if (q.type === "number") return rand(0, 8);
  if (q.type === "yes_no") return Math.random() > 0.25 ? "yes" : "no";
  if (q.type === "single_choice") return q.options?.[0]?.label || "Option 1";
  if (q.type === "multi_choice") return (q.options || []).slice(0, 2).map((x) => x.label);
  if (q.type === "file") return "https://example.com/attachment.pdf";
  return "I believe my skills and experience make me a strong fit for this opportunity.";
}

async function createApplications(
  jobs,
  employees,
  base,
  applicationsMinPerJob = APPLICATIONS_MIN_PER_JOB,
  applicationsMaxPerJob = APPLICATIONS_MAX_PER_JOB
) {
  let createdOrUpdated = 0;

  for (const job of jobs) {
    const applicants = sample(employees, rand(applicationsMinPerJob, applicationsMaxPerJob));

    for (const applicant of applicants) {
      const user = applicant.user;
      const employee = applicant.employee;
      const country = pick(base.countries);

      const app = await UserApplyingJobModel.findOneAndUpdate(
        { user_id: user._id, job_id: job._id },
        {
          $setOnInsert: {
            user_id: user._id,
            employee_id: employee._id,
            job_id: job._id,
            company_id: job.company_id,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            phone_code: user.phone_code || "+962",
            phone_national: user.phone_national || `770${rand(100000, 999999)}`,
            country_id: country._id,
            answers: (job.questions || []).map((q) => ({
              question_id: q._id,
              question: q.question,
              answer: answerForQuestion(q),
            })),
            cv: employee.cvs?.find((c) => c.status === "active")?.url || "",
            cover_letter: `Hello, I am interested in the ${job.job_name} role and would like to apply.`,
            user_job_rating: rand(3, 5),
            is_collect_rating: Math.random() > 0.5,
            source: pick(["app", "web", "invitation"]),
            status: pick(["waiting", "screening", "shortlisted", "interview", "rejected"]),
            status_changed_at: new Date(),
            last_activity_at: new Date(),
          },
        },
        { upsert: true, new: true, runValidators: true }
      );

      if (app) createdOrUpdated++;
    }

    const applicationsCount = await UserApplyingJobModel.countDocuments({ job_id: job._id });
    job.user_applying = applicationsCount;
    job.search_index = job.search_index || {};
    job.search_index.score_signals = {
      ...(job.search_index.score_signals || {}),
      applies: applicationsCount,
    };
    await job.save();
  }

  return createdOrUpdated;
}

export const seedJobsAndApplications = async ({
  jobsCount = JOBS_COUNT,
  existingCompaniesLimit = EXISTING_COMPANIES_LIMIT,
  existingEmployeesLimit = EXISTING_EMPLOYEES_LIMIT,
  applicationsMinPerJob = APPLICATIONS_MIN_PER_JOB,
  applicationsMaxPerJob = APPLICATIONS_MAX_PER_JOB,
  cleanFirst = true,
} = {}) => {
  try {
    let deleted = null;
    if (cleanFirst) {
      console.log("🧹 Deleting previous seed jobs/applications and old fake seed data...");
      deleted = await deletePreviousSeedData();
      console.log("🧹 Previous seed data deleted:", deleted);
    }

    console.log("🌱 Loading existing job lookup data...");
    const base = await loadExistingJobData();

    console.log("🏢 Loading existing real companies...");
    const companies = await loadExistingCompanies({
      limit: existingCompaniesLimit,
      min: 1,
    });

    console.log("👥 Loading existing real employees...");
    const employees = await loadExistingEmployees({
      limit: existingEmployeesLimit,
      min: applicationsMinPerJob,
    });

    console.log(`💼 Creating/updating ${jobsCount} jobs...`);
    const jobs = await createJobs(base, companies, jobsCount);

    console.log("📝 Creating employee applications...");
    const applicationsTouched = await createApplications(
      jobs,
      employees,
      base,
      applicationsMinPerJob,
      applicationsMaxPerJob
    );

    console.log("✅ Jobs and applications seeded successfully");

    return {
      deleted,
      existingCompaniesUsed: companies.length,
      existingEmployeesUsed: employees.length,
      jobs: jobs.length,
      applicationsTouched,
    };
  } catch (error) {
    console.error("❌ Jobs and applications seeder error:", error);
    throw error;
  }
};
