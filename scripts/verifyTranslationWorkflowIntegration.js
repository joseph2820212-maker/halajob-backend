import assert from "node:assert/strict";
import mongoose from "mongoose";
import { IntegrationMongoServer as MongoMemoryServer } from "./utils/integrationMongo.js";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET ||= "translation-workflow-integration-secret";
process.env.ACCESS_TOKEN_EXPIRATION_MINUTES ||= "30";
process.env.REFRESH_TOKEN_EXPIRATION_DAYS ||= "30";
process.env.HEALTH_SECRET ||= "translation-workflow-health-secret";

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
    headers: token ? authHeaders(token, contextId, headers) : { Accept: "application/json", "Content-Type": "application/json", ...headers },
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

function userSeed({ firstName, lastName, email, roleId, phone }) {
  return {
    first_name: firstName,
    last_name: lastName,
    email,
    gender: "male",
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

function jobSeed({ company, companyUser, suffix }) {
  return {
    job_name: `Translation Product Associate ${suffix}`,
    description: "This seeded job has enough text to validate the translation save and read workflow.",
    status: true,
    is_accepted: true,
    publish_status: "published",
    work_mode_id: objectId(),
    job_type_id: objectId(),
    job_time_id: objectId(),
    job_salary_id: objectId(),
    salary: {
      currency_id: objectId(),
      currency_code: "USD",
      currency_rate_snapshot: 1,
      min: 1200,
      max: 2400,
    },
    company_id: company._id,
    user_id: companyUser._id,
    skills_required: [{ title: "Customer support", level: 3 }],
    languages: [{ name: "English", level: 5, level_text: "fluent" }],
  };
}

async function main() {
  mongo = await MongoMemoryServer.create({
    instance: {
      dbName: `halajob-translation-workflow-${nowToken()}`,
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
    AuditLogModel,
    CompanyModel,
    ContentTranslationModel,
    EmployeeCvModel,
    EmployeeModel,
    RoleModel,
    UserModel,
    jobsModel,
  } = models;
  const { generateAuthTokens } = tokenService;

  await mongoose.connect(process.env.CONNECTION_URL, {
    serverSelectionTimeoutMS: 10000,
  });

  const suffix = nowToken();
  const phoneSeed = suffix.slice(-8);

  const [companyRole, employeeRole] = await RoleModel.create([
    {
      log_to: "company",
      name: `translation-company-${suffix}`,
      role_number: 970001,
      title_ar: "Company",
      title_en: "Company",
      status: true,
      is_system: true,
    },
    {
      log_to: "employee",
      name: `translation-employee-${suffix}`,
      role_number: 970002,
      title_ar: "Employee",
      title_en: "Employee",
      status: true,
      is_system: true,
    },
  ]);

  const [companyUser, otherCompanyUser, seekerUser] = await UserModel.create([
    userSeed({
      firstName: "Translation",
      lastName: "Company",
      email: `translation.company.${suffix}@example.com`,
      roleId: companyRole._id,
      phone: `${phoneSeed}01`,
    }),
    userSeed({
      firstName: "Translation",
      lastName: "OtherCompany",
      email: `translation.other.${suffix}@example.com`,
      roleId: companyRole._id,
      phone: `${phoneSeed}02`,
    }),
    userSeed({
      firstName: "Translation",
      lastName: "Seeker",
      email: `translation.seeker.${suffix}@example.com`,
      roleId: employeeRole._id,
      phone: `${phoneSeed}03`,
    }),
  ]);

  const [company, otherCompany] = await CompanyModel.create([
    {
      company_name: `Translation Company ${suffix}`,
      company_email: `translation.${suffix}@company.example.com`,
      owner_user_id: companyUser._id,
      role_id: companyRole._id,
      status: true,
      accepted: true,
      can_upload: true,
      is_verified: true,
      profile_completion: 80,
    },
    {
      company_name: `Translation Other Company ${suffix}`,
      company_email: `translation.other.${suffix}@company.example.com`,
      owner_user_id: otherCompanyUser._id,
      role_id: companyRole._id,
      status: true,
      accepted: true,
      can_upload: true,
      is_verified: true,
      profile_completion: 80,
    },
  ]);

  const [job] = await jobsModel.create([jobSeed({ company, companyUser, suffix })]);

  const employee = await EmployeeModel.create({
    user_id: seekerUser._id,
    role_id: employeeRole._id,
    status: true,
    accepted: true,
    profile_headline: "Customer support associate",
    current_job_title: "Student ambassador",
    about_me: "I help campus teams support applicants and hiring managers.",
    candidate_stage: "student",
    skills: [{ title: "Support", level: 3 }],
  });

  const cv = await EmployeeCvModel.create({
    employee_id: employee._id,
    template_id: objectId(),
    template_key: "translation-template",
    title: "Translation test CV",
    is_default: true,
  });

  const [companyContext, otherCompanyContext, seekerContext] = await AccountContextModel.create([
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
    {
      user_id: otherCompanyUser._id,
      context_key: `company_admin:${otherCompany._id}`,
      context_type: "company_admin",
      entity_id: otherCompany._id,
      entity_model: "companies",
      display_name: otherCompany.company_name,
      status: "active",
      permissions: ["*"],
      is_default: true,
    },
    {
      user_id: seekerUser._id,
      context_key: `job_seeker:${employee._id}`,
      context_type: "job_seeker",
      entity_id: employee._id,
      entity_model: "employees",
      display_name: "Translation seeker",
      status: "active",
      permissions: ["jobs.search", "jobs.apply"],
      is_default: true,
    },
  ]);

  await Promise.all([
    UserModel.updateOne({ _id: companyUser._id }, { $set: { default_context_id: companyContext._id } }),
    UserModel.updateOne({ _id: otherCompanyUser._id }, { $set: { default_context_id: otherCompanyContext._id } }),
    UserModel.updateOne({ _id: seekerUser._id }, { $set: { default_context_id: seekerContext._id } }),
  ]);

  const device = { brand: "Translation", model_name: "Integration", is_device: false };
  const [companyTokens, otherCompanyTokens, seekerTokens] = await Promise.all([
    generateAuthTokens(companyUser, device),
    generateAuthTokens(otherCompanyUser, device),
    generateAuthTokens(seekerUser, device),
  ]);

  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  await expectStatus(
    request(baseUrl, "GET", `/jobs/v1/${job._id}/translations/ar`, {
      token: companyTokens.accessToken,
      contextId: companyContext._id,
    }),
    404,
    "job translation should not exist before save"
  );

  const draftJob = await expectStatus(
    request(baseUrl, "PUT", `/jobs/v1/${job._id}/translations/ar`, {
      token: companyTokens.accessToken,
      contextId: companyContext._id,
      body: {
        status: "draft",
        translated_text: {
          job_name: "مساعد دعم المنتجات",
          description: "وصف عربي قابل للمراجعة قبل النشر.",
        },
      },
    }),
    200,
    "company owner should save draft job translation"
  );
  assert.equal(draftJob.data.can_publish, false);
  assert.equal(draftJob.data.translation.status, "draft");

  const readDraftJob = await expectStatus(
    request(baseUrl, "GET", `/jobs/v1/${job._id}/translations/ar`, {
      token: companyTokens.accessToken,
      contextId: companyContext._id,
    }),
    200,
    "company owner should read saved draft job translation"
  );
  assert.equal(readDraftJob.data.translation.status, "draft");
  assert.equal(readDraftJob.data.published_translation, null);

  const approvedJob = await expectStatus(
    request(baseUrl, "PUT", `/jobs/v1/${job._id}/translations/ar`, {
      token: companyTokens.accessToken,
      contextId: companyContext._id,
      body: {
        approve: true,
        translated_text: {
          job_name: "مساعد دعم المنتجات",
          description: "وصف عربي معتمد للنشر.",
        },
      },
    }),
    200,
    "company owner should approve job translation"
  );
  assert.equal(approvedJob.data.can_publish, true);

  const readApprovedJob = await expectStatus(
    request(baseUrl, "GET", `/jobs/v1/${job._id}/translations/ar`, {
      token: companyTokens.accessToken,
      contextId: companyContext._id,
    }),
    200,
    "company owner should read approved job translation"
  );
  assert.equal(readApprovedJob.data.translation.status, "approved");
  assert.equal(readApprovedJob.data.published_translation.job_name, "مساعد دعم المنتجات");

  await expectStatus(
    request(baseUrl, "GET", `/jobs/v1/${job._id}/translations/ar`, {
      token: otherCompanyTokens.accessToken,
      contextId: otherCompanyContext._id,
    }),
    404,
    "other company should not read owned job translation"
  );

  await expectStatus(
    request(baseUrl, "GET", "/user/v1/cv/translations/fr", {
      token: seekerTokens.accessToken,
      contextId: seekerContext._id,
    }),
    422,
    "unsupported CV translation language should fail"
  );

  await expectStatus(
    request(baseUrl, "GET", `/user/v1/cv/translations/ar?cv_id=${cv._id}`, {
      token: seekerTokens.accessToken,
      contextId: seekerContext._id,
    }),
    404,
    "CV translation should not exist before save"
  );

  const approvedCv = await expectStatus(
    request(baseUrl, "PUT", "/user/v1/cv/translations/ar", {
      token: seekerTokens.accessToken,
      contextId: seekerContext._id,
      body: {
        cv_id: cv._id,
        approve: true,
        translated_text: {
          title: "السيرة الذاتية المعتمدة",
          profile_headline: "مرشح دعم العملاء",
        },
      },
    }),
    200,
    "seeker should approve CV translation"
  );
  assert.equal(approvedCv.data.can_publish, true);

  const readApprovedCv = await expectStatus(
    request(baseUrl, "GET", `/user/v1/cv/translations/ar?cv_id=${cv._id}`, {
      token: seekerTokens.accessToken,
      contextId: seekerContext._id,
    }),
    200,
    "seeker should read approved CV translation"
  );
  assert.equal(readApprovedCv.data.translation.status, "approved");
  assert.equal(readApprovedCv.data.published_translation.title, "السيرة الذاتية المعتمدة");

  const [jobTranslation, cvTranslation, jobAudit, cvAudit, jobAnalytics, cvAnalytics] = await Promise.all([
    ContentTranslationModel.findOne({ entity_type: "job", entity_id: job._id, target_language: "ar" }).lean(),
    ContentTranslationModel.findOne({ entity_type: "cv", entity_id: cv._id, target_language: "ar" }).lean(),
    AuditLogModel.findOne({ action: "job_translation_approved", job_id: job._id }).lean(),
    AuditLogModel.findOne({ action: "cv_translation_approved", entity_type: "translation" }).lean(),
    AnalyticsEventModel.findOne({ event: "job_translated", job_id: job._id }).lean(),
    AnalyticsEventModel.findOne({ event: "cv_translated", entity_type: "cv" }).lean(),
  ]);
  assert.equal(jobTranslation.status, "approved");
  assert.equal(cvTranslation.status, "approved");
  assert.ok(jobAudit, "job translation approval should be audited");
  assert.ok(cvAudit, "CV translation approval should be audited");
  assert.ok(jobAnalytics, "job translation should emit analytics");
  assert.ok(cvAnalytics, "CV translation should emit analytics");

  console.log("Translation workflow integration verified for job/CV save, read, approval, ownership denial, unsupported language, audit logs, and analytics.");
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
