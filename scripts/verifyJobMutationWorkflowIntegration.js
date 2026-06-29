import assert from "node:assert/strict";
import mongoose from "mongoose";
import { IntegrationMongoServer as MongoMemoryServer } from "./utils/integrationMongo.js";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET ||= "job-mutation-workflow-integration-secret";
process.env.ACCESS_TOKEN_EXPIRATION_MINUTES ||= "30";
process.env.REFRESH_TOKEN_EXPIRATION_DAYS ||= "30";
process.env.HEALTH_SECRET ||= "job-mutation-workflow-health-secret";

let mongo;
let server;

const nowToken = () => new Date().toISOString().replace(/[-:.TZ]/g, "");
const objectId = () => new mongoose.Types.ObjectId();

function authHeaders(token, contextId, extra = {}) {
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...(contextId ? { "X-Active-Context-Id": String(contextId) } : {}),
    ...extra,
  };
}

async function request(baseUrl, method, pathName, { token, contextId, body, headers } = {}) {
  const hasBody = !["GET", "HEAD"].includes(method);
  return fetch(`${baseUrl}${pathName}`, {
    method,
    headers: token
      ? authHeaders(token, contextId, headers)
      : { Accept: "application/json", "Content-Type": "application/json", ...headers },
    ...(hasBody ? { body: JSON.stringify(body || {}) } : {}),
  });
}

async function readJson(response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

async function expectStatus(responsePromise, expected, label) {
  const response = await responsePromise;
  const payload = await readJson(response);
  assert.equal(
    response.status,
    expected,
    `${label} should return ${expected}; got ${response.status}; body=${JSON.stringify(payload)}`
  );
  return payload;
}

async function waitFor(findFn, label, tries = 20) {
  for (let i = 0; i < tries; i += 1) {
    const found = await findFn();
    if (found) return found;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  assert.fail(`${label} was not found`);
}

function userSeed({ firstName, lastName, email, roleId, phone }) {
  return {
    first_name: firstName,
    last_name: lastName,
    email,
    gender: "female",
    role_id: roleId,
    password: "not-used",
    status: true,
    phone: `+1555${phone}`,
    phone_e164: `+1555${phone}`,
    phone_country: "US",
    phone_code: "+1",
    phone_national: `555${phone}`,
  };
}

function jobSeed({ company, companyUser, suffix, title, isExternal = false, countryId }) {
  return {
    job_name: `${title} ${suffix}`,
    ref: `MUT-${title.replace(/[^A-Za-z0-9]+/g, "-").slice(0, 24)}-${suffix.slice(-10)}`,
    description:
      "This seeded public job has enough description text to exercise candidate mutation workflows and side effects safely.",
    status: true,
    is_accepted: true,
    publish_status: "published",
    started_date: new Date(Date.now() - 24 * 60 * 60 * 1000),
    end_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    apply_deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    countries: [String(countryId)],
    city: "Remote",
    work_mode_id: objectId(),
    work_mode_info: { key: "remote", title_en: "Remote" },
    is_remote: true,
    job_type_id: objectId(),
    job_type_info: { title_en: "Full time" },
    job_time_id: objectId(),
    job_time_info: { title_en: "Day shift" },
    job_salary_id: objectId(),
    job_salary_info: { title_en: "Monthly" },
    salary: {
      currency_id: objectId(),
      currency_code: "USD",
      currency_rate_snapshot: 1,
      min: 1200,
      max: 2200,
    },
    company_id: company._id,
    user_id: companyUser._id,
    skills_required: [{ title: "Customer support", level: 3 }],
    languages: [{ name: "English", level: 5, level_text: "fluent" }],
    is_cv_required: true,
    is_out_side: isExternal,
    out_link: isExternal ? "https://example.com/apply" : "",
  };
}

async function main() {
  mongo = await MongoMemoryServer.create({
    instance: {
      dbName: `halajob-job-mutation-workflow-${nowToken()}`,
    },
  });

  process.env.CONNECTION_URL = mongo.getUri();

  const [{ default: app }, models, tokenService] = await Promise.all([
    import("../app.js"),
    import("../models/index.js"),
    import("../services/tokenService.js"),
  ]);

  const {
    AccountContextModel,
    AnalyticsEventModel,
    ApplicationStatusHistoryModel,
    AuditLogModel,
    CompanyModel,
    EmployeeModel,
    JobReportModel,
    RoleModel,
    UserApplyingJobModel,
    UserModel,
    UserOutSideApplyingJobModel,
    UserRatingJobModel,
    UserReviewJobModel,
    UserSavedJobModel,
    jobsModel,
  } = models;
  const { generateAuthTokens } = tokenService;

  await mongoose.connect(process.env.CONNECTION_URL, {
    serverSelectionTimeoutMS: 10000,
  });

  const suffix = nowToken();
  const phoneSeed = suffix.slice(-8);
  const countryId = objectId();
  const [employeeRole, companyRole] = await RoleModel.create([
    {
      log_to: "employee",
      name: `job-mutation-employee-${suffix}`,
      role_number: 980001,
      title_ar: "Employee",
      title_en: "Employee",
      status: true,
      is_system: true,
    },
    {
      log_to: "company",
      name: `job-mutation-company-${suffix}`,
      role_number: 980002,
      title_ar: "Company",
      title_en: "Company",
      status: true,
      is_system: true,
    },
  ]);

  const [seekerUser, companyUser] = await UserModel.create([
    userSeed({
      firstName: "Mutation",
      lastName: "Seeker",
      email: `job.mutation.seeker.${suffix}@example.com`,
      roleId: employeeRole._id,
      phone: `${phoneSeed}01`,
    }),
    userSeed({
      firstName: "Mutation",
      lastName: "Company",
      email: `job.mutation.company.${suffix}@example.com`,
      roleId: companyRole._id,
      phone: `${phoneSeed}02`,
    }),
  ]);

  const company = await CompanyModel.create({
    company_name: `Mutation Company ${suffix}`,
    company_email: `mutation.${suffix}@company.example.com`,
    owner_user_id: companyUser._id,
    role_id: companyRole._id,
    status: true,
    accepted: true,
    can_upload: true,
    is_verified: true,
    profile_completion: 90,
  });

  const employee = await EmployeeModel.create({
    user_id: seekerUser._id,
    role_id: employeeRole._id,
    status: true,
    accepted: true,
    profile_headline: "Customer support associate",
    current_job_title: "Campus support ambassador",
    about_me: "I support job seekers and employers through application and interview workflows.",
    candidate_stage: "student",
    is_student: true,
    experience_years: 1,
    preferred_countries: [countryId],
    preferred_work_modes: [objectId()],
    job_names: [objectId()],
    job_types: [objectId()],
    skills: [{ title: "Customer support", level: 4, years: 1 }],
    languages: [{ level: 5 }],
    education: [{ level: "Bachelor", study: "Business", institution: "Integration University" }],
    cvs: [
      {
        title: "Mutation CV",
        fileName: "mutation-cv.pdf",
        url: "/uploads/test/mutation-cv.pdf",
        status: "active",
      },
    ],
    expected_salary: {
      min: 1000,
      max: 2500,
      currency_id: objectId(),
      currency_code: "USD",
      currency_rate: 1,
    },
  });

  const [seekerContext, companyContext] = await AccountContextModel.create([
    {
      user_id: seekerUser._id,
      context_key: `job_seeker:${employee._id}`,
      context_type: "job_seeker",
      entity_id: employee._id,
      entity_model: "employees",
      display_name: "Mutation seeker",
      status: "active",
      permissions: ["jobs.search", "jobs.apply"],
      is_default: true,
    },
    {
      user_id: companyUser._id,
      context_key: `company_admin:${company._id}`,
      context_type: "company_admin",
      entity_id: company._id,
      entity_model: "companies",
      display_name: company.company_name,
      status: "active",
      permissions: ["*"],
      is_default: true,
    },
  ]);

  await Promise.all([
    UserModel.updateOne({ _id: seekerUser._id }, { $set: { default_context_id: seekerContext._id } }),
    UserModel.updateOne({ _id: companyUser._id }, { $set: { default_context_id: companyContext._id } }),
  ]);

  const [statsJob, employeeApplyJob, modernApplyJob, employeeExternalJob, modernExternalJob] =
    await jobsModel.create([
      jobSeed({ company, companyUser, suffix, title: "Stats Workflow", countryId }),
      jobSeed({ company, companyUser, suffix, title: "Employee Apply Workflow", countryId }),
      jobSeed({ company, companyUser, suffix, title: "Modern Apply Workflow", countryId }),
      jobSeed({ company, companyUser, suffix, title: "Employee External Workflow", isExternal: true, countryId }),
      jobSeed({ company, companyUser, suffix, title: "Modern External Workflow", isExternal: true, countryId }),
    ]);

  const device = { brand: "JobMutation", model_name: "Integration", is_device: false };
  const seekerTokens = await generateAuthTokens(seekerUser, device);

  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  await expectStatus(
    request(baseUrl, "POST", `/employee/v1/jobs/${statsJob._id}/save`),
    401,
    "missing bearer token should not save jobs"
  );

  await expectStatus(
    request(baseUrl, "POST", `/employee/v1/jobs/${statsJob._id}/save`, {
      token: seekerTokens.accessToken,
      contextId: seekerContext._id,
    }),
    200,
    "seeker should save a job through employee alias"
  );

  await expectStatus(
    request(baseUrl, "POST", `/employee/v1/jobs/${statsJob._id}/save`, {
      token: seekerTokens.accessToken,
      contextId: seekerContext._id,
    }),
    200,
    "repeated employee alias save should be idempotent"
  );

  let statsJobAfterSave = await jobsModel.findById(statsJob._id).lean();
  assert.equal(await UserSavedJobModel.countDocuments({ user_id: seekerUser._id, job_id: statsJob._id }), 1);
  assert.equal(statsJobAfterSave.user_saved, 1, "save counter should increment once");
  assert.equal(statsJobAfterSave.search_index.score_signals.saves, 1, "save score signal should increment once");

  await waitFor(
    () => AnalyticsEventModel.findOne({ event: "job_saved", job_id: statsJob._id }).lean(),
    "employee alias job_saved analytics"
  );

  await expectStatus(
    request(baseUrl, "DELETE", `/employee/v1/jobs/${statsJob._id}/save`, {
      token: seekerTokens.accessToken,
      contextId: seekerContext._id,
    }),
    200,
    "seeker should unsave a job through employee alias"
  );

  let statsJobAfterUnsave = await jobsModel.findById(statsJob._id).lean();
  assert.equal(await UserSavedJobModel.countDocuments({ user_id: seekerUser._id, job_id: statsJob._id }), 0);
  assert.equal(statsJobAfterUnsave.user_saved, 0, "unsave should clamp visible counter to zero");
  assert.equal(statsJobAfterUnsave.search_index.score_signals.saves, 0, "unsave should clamp save signal to zero");

  await expectStatus(
    request(baseUrl, "POST", `/user/v1/job-information/toggle-save-job/${statsJob._id}`, {
      token: seekerTokens.accessToken,
      contextId: seekerContext._id,
    }),
    201,
    "modern toggle save should save"
  );

  await expectStatus(
    request(baseUrl, "POST", `/user/v1/job-information/toggle-save-job/${statsJob._id}`, {
      token: seekerTokens.accessToken,
      contextId: seekerContext._id,
    }),
    201,
    "modern toggle save should unsave"
  );

  statsJobAfterUnsave = await jobsModel.findById(statsJob._id).lean();
  assert.equal(statsJobAfterUnsave.user_saved, 0, "modern unsave should clamp visible counter to zero");
  assert.equal(statsJobAfterUnsave.search_index.score_signals.saves, 0, "modern unsave should clamp save signal to zero");

  await expectStatus(
    request(baseUrl, "POST", `/employee/v1/jobs/${statsJob._id}/rate`, {
      token: seekerTokens.accessToken,
      contextId: seekerContext._id,
      body: { rating: 5 },
    }),
    200,
    "seeker should rate a job"
  );

  await expectStatus(
    request(baseUrl, "POST", `/employee/v1/jobs/${statsJob._id}/rate`, {
      token: seekerTokens.accessToken,
      contextId: seekerContext._id,
      body: { rating: 3 },
    }),
    200,
    "repeated rating should update existing rating"
  );

  const [ratingCount, statsJobAfterRating] = await Promise.all([
    UserRatingJobModel.countDocuments({ user_id: seekerUser._id, job_id: statsJob._id }),
    jobsModel.findById(statsJob._id).lean(),
  ]);
  assert.equal(ratingCount, 1, "rating should be upserted, not duplicated");
  assert.equal(statsJobAfterRating.rating, 3, "job rating should be recomputed after update");
  assert.equal(statsJobAfterRating.search_index.score_signals.rating, 3, "rating score signal should be recomputed");

  await expectStatus(
    request(baseUrl, "POST", `/employee/v1/jobs/${statsJob._id}/review`, {
      token: seekerTokens.accessToken,
      contextId: seekerContext._id,
      body: { message: "This role looks clear and relevant." },
    }),
    200,
    "seeker should review a job"
  );

  await expectStatus(
    request(baseUrl, "POST", `/employee/v1/jobs/${statsJob._id}/review`, {
      token: seekerTokens.accessToken,
      contextId: seekerContext._id,
      body: { message: "Updated review text for the same job." },
    }),
    200,
    "repeated review should update existing review"
  );

  const [reviewCount, statsJobAfterReview] = await Promise.all([
    UserReviewJobModel.countDocuments({ user_id: seekerUser._id, job_id: statsJob._id }),
    jobsModel.findById(statsJob._id).lean(),
  ]);
  assert.equal(reviewCount, 1, "review should be upserted, not duplicated");
  assert.equal(statsJobAfterReview.user_review, 1, "review counter should not inflate on edit");
  assert.equal(statsJobAfterReview.search_index.score_signals.reviews, 1, "review signal should not inflate on edit");

  await expectStatus(
    request(baseUrl, "POST", `/employee/v1/jobs/${employeeApplyJob._id}/apply`, {
      token: seekerTokens.accessToken,
      contextId: seekerContext._id,
      body: {
        country_id: countryId,
        cv: "/uploads/test/mutation-cv.pdf",
        cover_letter: "I am interested in this seeded role.",
      },
    }),
    201,
    "seeker should apply through employee alias"
  );

  await expectStatus(
    request(baseUrl, "POST", `/employee/v1/jobs/${employeeApplyJob._id}/apply`, {
      token: seekerTokens.accessToken,
      contextId: seekerContext._id,
      body: {
        country_id: countryId,
        cv: "/uploads/test/mutation-cv.pdf",
      },
    }),
    409,
    "repeated employee alias apply should be blocked"
  );

  const employeeApplication = await UserApplyingJobModel.findOne({
    user_id: seekerUser._id,
    job_id: employeeApplyJob._id,
  }).lean();
  assert.ok(employeeApplication, "employee alias apply should create an application");
  const employeeApplyJobAfterApply = await jobsModel.findById(employeeApplyJob._id).lean();
  assert.equal(employeeApplyJobAfterApply.user_applying, 1, "employee alias apply should increment applications");
  assert.equal(
    employeeApplyJobAfterApply.search_index.score_signals.applies,
    1,
    "employee alias apply should increment apply signal"
  );
  assert.ok(
    await ApplicationStatusHistoryModel.findOne({ application_id: employeeApplication._id }).lean(),
    "employee alias apply should create status history"
  );
  assert.ok(
    await AuditLogModel.findOne({ action: "application_created", application_id: employeeApplication._id }).lean(),
    "employee alias apply should create audit log"
  );
  assert.ok(
    await AnalyticsEventModel.findOne({ event: "job_applied", application_id: employeeApplication._id }).lean(),
    "employee alias apply should create analytics event"
  );

  await expectStatus(
    request(baseUrl, "POST", `/user/v1/applying-job/insert/${modernApplyJob._id}`, {
      token: seekerTokens.accessToken,
      contextId: seekerContext._id,
      body: {
        cover_letter: "I am also interested in the modern route role.",
      },
    }),
    201,
    "seeker should apply through modern app route"
  );

  await expectStatus(
    request(baseUrl, "POST", `/user/v1/applying-job/insert/${modernApplyJob._id}`, {
      token: seekerTokens.accessToken,
      contextId: seekerContext._id,
      body: {},
    }),
    409,
    "repeated modern app apply should be blocked"
  );

  const modernApplication = await UserApplyingJobModel.findOne({
    user_id: seekerUser._id,
    job_id: modernApplyJob._id,
  }).lean();
  assert.ok(modernApplication, "modern app apply should create an application");
  assert.ok(
    await AuditLogModel.findOne({ action: "application_created", application_id: modernApplication._id }).lean(),
    "modern app apply should create audit log"
  );
  assert.ok(
    await AnalyticsEventModel.findOne({ event: "job_applied", application_id: modernApplication._id }).lean(),
    "modern app apply should create analytics event"
  );

  await expectStatus(
    request(baseUrl, "POST", `/employee/v1/jobs/${employeeExternalJob._id}/apply`, {
      token: seekerTokens.accessToken,
      contextId: seekerContext._id,
    }),
    200,
    "employee alias external apply should be recorded"
  );

  await expectStatus(
    request(baseUrl, "POST", `/employee/v1/jobs/${employeeExternalJob._id}/apply`, {
      token: seekerTokens.accessToken,
      contextId: seekerContext._id,
    }),
    200,
    "repeated employee alias external apply should remain idempotent"
  );

  const employeeExternalAfterApply = await jobsModel.findById(employeeExternalJob._id).lean();
  assert.equal(employeeExternalAfterApply.out_side_applying, 1, "employee external apply should increment once");
  assert.equal(
    employeeExternalAfterApply.search_index.score_signals.applies,
    1,
    "employee external apply should increment apply signal once"
  );
  assert.ok(
    await AnalyticsEventModel.findOne({ event: "job_applied", job_id: employeeExternalJob._id }).lean(),
    "employee external apply should create analytics"
  );

  await expectStatus(
    request(baseUrl, "POST", `/user/v1/job-information/apply-outside/${modernExternalJob._id}`, {
      token: seekerTokens.accessToken,
      contextId: seekerContext._id,
    }),
    201,
    "modern outside apply should be recorded"
  );

  await expectStatus(
    request(baseUrl, "POST", `/user/v1/job-information/apply-outside/${modernExternalJob._id}`, {
      token: seekerTokens.accessToken,
      contextId: seekerContext._id,
    }),
    409,
    "repeated modern outside apply should be blocked"
  );

  const modernExternalAfterApply = await jobsModel.findById(modernExternalJob._id).lean();
  assert.equal(
    await UserOutSideApplyingJobModel.countDocuments({ user_id: seekerUser._id, job_id: modernExternalJob._id }),
    1,
    "modern outside apply should be upsert-safe"
  );
  assert.equal(modernExternalAfterApply.out_side_applying, 1, "modern outside apply should increment once");
  assert.equal(modernExternalAfterApply.search_index.score_signals.applies, 1, "modern outside apply signal should increment once");

  await expectStatus(
    request(baseUrl, "POST", `/user/v1/job-information/report-job/${statsJob._id}`, {
      token: seekerTokens.accessToken,
      contextId: seekerContext._id,
      body: {
        reason: "wrong_information",
        message: "The details need review before applicants trust this posting.",
      },
    }),
    201,
    "modern job-information report should be accepted"
  );

  const [report, reportAudit, reportAnalytics, statsJobAfterReport] = await Promise.all([
    JobReportModel.findOne({ user_id: seekerUser._id, job_id: statsJob._id }).lean(),
    AuditLogModel.findOne({ action: "job_reported", job_id: statsJob._id }).lean(),
    AnalyticsEventModel.findOne({ event: "job_reported", job_id: statsJob._id }).lean(),
    jobsModel.findById(statsJob._id).lean(),
  ]);
  assert.equal(report?.reason, "wrong_information", "report reason should persist");
  assert.ok(reportAudit, "job report should create audit log");
  assert.ok(reportAnalytics, "job report should create analytics event");
  assert.equal(statsJobAfterReport.trust.report_count, 1, "job report should recompute trust report count");

  console.log(
    "Job mutation workflow integration verified for save/unsave, rate, review, internal apply, external apply, reports, counters, audit logs, and analytics."
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await mongoose.disconnect().catch(() => null);
    if (mongo) await mongo.stop();
  });
