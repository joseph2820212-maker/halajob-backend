import assert from "node:assert/strict";
import mongoose from "mongoose";
import { IntegrationMongoServer as MongoMemoryServer } from "./utils/integrationMongo.js";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET ||= "salary-insights-integration-secret";
process.env.ACCESS_TOKEN_EXPIRATION_MINUTES ||= "30";
process.env.REFRESH_TOKEN_EXPIRATION_DAYS ||= "30";
process.env.HEALTH_SECRET ||= "salary-insights-health-secret";

let mongo;
let server;

const nowToken = () => new Date().toISOString().replace(/[-:.TZ]/g, "");

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
    `${label} should return ${expected}; got ${response.status}; body=${JSON.stringify(payload)}`,
  );
  return { response, payload };
}

function userSeed({ firstName, lastName, email, roleId }) {
  return {
    first_name: firstName,
    last_name: lastName,
    email,
    gender: "female",
    role_id: roleId,
    password: "not-used",
    status: true,
    phone: "+963944555111",
    phone_e164: "+963944555111",
    phone_country: "SY",
    phone_code: "+963",
    phone_national: "944555111",
  };
}

function jobSeed({ suffix, title, min, max, userId, companyId, experienceLevelId, hidden = false, nullSalary = false }) {
  const lookupId = () => new mongoose.Types.ObjectId();
  const salary = nullSalary
    ? {
        min: null,
        max: null,
        currency_id: lookupId(),
        currency_code: "SYP",
        currency_rate_snapshot: 1000,
        mode: "range",
        is_visible: true,
      }
    : {
        min,
        max,
        currency_id: lookupId(),
        currency_code: "SYP",
        currency_rate_snapshot: 1000,
        min_usd: min / 1000,
        max_usd: max / 1000,
        mode: hidden ? "hidden" : "range",
        is_visible: !hidden,
      };
  return {
    job_name: title,
    description: `${title} role for salary insights integration testing in Damascus with enough detail.`,
    ref: `SALARY-${suffix}-${String(title).replace(/[^a-z0-9]/gi, "-")}-${min || "null"}-${max || "null"}-${hidden ? "hidden" : "visible"}`,
    status: true,
    is_accepted: true,
    publish_status: "published",
    deleted_at: null,
    started_date: new Date(),
    end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    city: "Damascus",
    cities: ["Damascus"],
    countries: ["Syria"],
    keywords_norm: ["backend", "developer"],
    search_index: {
      title_norm: title.toLowerCase(),
      text_norm: `${title} backend developer`.toLowerCase(),
      filters: {
        city: "damascus",
        countries: ["syria"],
        currency: "SYP",
        salary_min: min ?? null,
        salary_max: max ?? null,
        salary_min_usd: min ? min / 1000 : null,
        salary_max_usd: max ? max / 1000 : null,
      },
    },
    work_mode_id: lookupId(),
    job_type_id: lookupId(),
    job_time_id: lookupId(),
    job_salary_id: lookupId(),
    experience_level_id: experienceLevelId || lookupId(),
    salary,
    company_id: companyId,
    user_id: userId,
  };
}

async function main() {
  mongo = await MongoMemoryServer.create({
    instance: {
      dbName: `halajob-salary-insights-${nowToken()}`,
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
    CompanyModel,
    RoleModel,
    SalaryInsightAggregateModel,
    UserModel,
    jobsModel,
  } = models;
  const { generateAuthTokens } = tokenService;

  await mongoose.connect(process.env.CONNECTION_URL, {
    serverSelectionTimeoutMS: 10000,
  });

  const suffix = nowToken().toLowerCase();
  const [employeeRole, companyRole, adminRole] = await RoleModel.create([
    {
      log_to: "employee",
      name: `salary-employee-${suffix}`,
      role_number: 996201,
      title_ar: "Employee",
      title_en: "Employee",
      status: true,
      is_system: true,
    },
    {
      log_to: "company",
      name: `salary-company-${suffix}`,
      role_number: 3,
      title_ar: "Company",
      title_en: "Company",
      status: true,
      is_system: true,
    },
    {
      log_to: "dash",
      name: "admin",
      role_number: 1,
      title_ar: "Admin",
      title_en: "Admin",
      status: true,
      is_system: true,
    },
  ]);

  const [seekerUser, companyUser, adminUser] = await UserModel.create([
    userSeed({
      firstName: "Salary",
      lastName: "Seeker",
      email: `salary.seeker.${suffix}@example.com`,
      roleId: employeeRole._id,
    }),
    userSeed({
      firstName: "Salary",
      lastName: "Company",
      email: `salary.company.${suffix}@example.com`,
      roleId: companyRole._id,
    }),
    userSeed({
      firstName: "Salary",
      lastName: "Admin",
      email: `salary.admin.${suffix}@example.com`,
      roleId: adminRole._id,
    }),
  ]);

  const company = await CompanyModel.create({
    company_name: `Salary Insights Co ${suffix}`,
    company_email: `salary.company.profile.${suffix}@example.com`,
    owner_user_id: companyUser._id,
    role_id: companyRole._id,
    status: true,
    accepted: true,
    can_upload: true,
    is_verified: true,
  });
  const companyContext = await AccountContextModel.create({
    user_id: companyUser._id,
    context_key: `company_admin:${company._id}`,
    context_type: "company_admin",
    entity_id: company._id,
    entity_model: "companies",
    display_name: company.company_name,
    status: "active",
    permissions: ["ats.view", "jobs.manage"],
    is_default: true,
  });
  await UserModel.updateOne({ _id: companyUser._id }, { $set: { default_context_id: companyContext._id } });

  const device = { brand: "Salary Insights", model_name: "Integration", is_device: false };
  const [seekerTokens, companyTokens, adminTokens] = await Promise.all([
    generateAuthTokens(seekerUser, device),
    generateAuthTokens(companyUser, device),
    generateAuthTokens(adminUser, device),
  ]);

  const sharedExperienceLevelId = new mongoose.Types.ObjectId();
  const salaries = [
    [1000000, 1200000],
    [1200000, 1400000],
    [1400000, 1600000],
    [1600000, 1800000],
  ];
  const visibleJobs = await jobsModel.create(
    salaries.map(([min, max]) =>
      jobSeed({
        suffix,
        title: "Backend Developer",
        min,
        max,
        userId: companyUser._id,
        companyId: company._id,
        experienceLevelId: sharedExperienceLevelId,
      }),
    ),
  );
  await jobsModel.create([
    jobSeed({
      suffix,
      title: "Backend Developer",
      min: 99000000,
      max: 100000000,
      userId: companyUser._id,
      companyId: company._id,
      experienceLevelId: sharedExperienceLevelId,
      hidden: true,
    }),
    jobSeed({
      suffix,
      title: "Backend Developer",
      min: null,
      max: null,
      userId: companyUser._id,
      companyId: company._id,
      experienceLevelId: sharedExperienceLevelId,
      nullSalary: true,
    }),
  ]);

  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;
  const query = "title=Backend%20Developer&city=Damascus&country=Syria&currency_code=SYP";

  const publicInsight = await expectStatus(
    request(baseUrl, "GET", `/public/v1/salary-insights?${query}`),
    200,
    "public salary insight",
  );
  assert.equal(publicInsight.payload.data.sample_size, 4, "hidden and null salary jobs should be excluded");
  assert.equal(publicInsight.payload.data.confidence, "low");
  assert.equal(publicInsight.payload.data.median, 1400000);
  assert.equal(publicInsight.payload.data.source_label, "Based on Hala Job listings");
  assert.equal("company_id" in publicInsight.payload.data, false, "public insight must not expose company IDs");

  const slugInsight = await expectStatus(
    request(baseUrl, "GET", `/public/v1/salary-insights/backend-developer?city=Damascus&country=Syria&currency_code=SYP`),
    200,
    "public salary insight by slug",
  );
  assert.equal(slugInsight.payload.data.sample_size, 4);

  const userJobInsight = await expectStatus(
    request(baseUrl, "GET", `/user/v1/salary-insights/jobs/${visibleJobs[0]._id}`, {
      token: seekerTokens.accessToken,
    }),
    200,
    "user job salary insight",
  );
  assert.equal(userJobInsight.payload.data.insight.sample_size, 4);

  const fair = await expectStatus(
    request(baseUrl, "POST", "/company/v1/salary-insights/check", {
      token: companyTokens.accessToken,
      contextId: companyContext._id,
      body: {
        title: "Backend Developer",
        city: "Damascus",
        country: "Syria",
        currency_code: "SYP",
        currency_rate_snapshot: 1000,
        min: 1300000,
        max: 1500000,
      },
    }),
    201,
    "company fair salary check",
  );
  assert.equal(fair.payload.data.status, "fair");

  const below = await expectStatus(
    request(baseUrl, "POST", "/company/v1/salary-insights/check", {
      token: companyTokens.accessToken,
      contextId: companyContext._id,
      body: {
        title: "Backend Developer",
        city: "Damascus",
        country: "Syria",
        currency_code: "SYP",
        currency_rate_snapshot: 1000,
        min: 300000,
        max: 400000,
      },
    }),
    201,
    "company below salary check",
  );
  assert.equal(below.payload.data.status, "below");

  const above = await expectStatus(
    request(baseUrl, "POST", "/company/v1/salary-insights/check", {
      token: companyTokens.accessToken,
      contextId: companyContext._id,
      body: {
        title: "Backend Developer",
        city: "Damascus",
        country: "Syria",
        currency_code: "SYP",
        currency_rate_snapshot: 1000,
        min: 3000000,
        max: 3500000,
      },
    }),
    201,
    "company above salary check",
  );
  assert.equal(above.payload.data.status, "above");

  await expectStatus(
    request(baseUrl, "GET", `/company/v1/salary-insights/suggest?${query}`, {
      token: companyTokens.accessToken,
      contextId: companyContext._id,
    }),
    200,
    "company salary suggest",
  );

  const rebuilt = await expectStatus(
    request(baseUrl, "POST", "/dash/v1/salary-insights/rebuild", {
      token: adminTokens.accessToken,
      body: { limit: 25 },
    }),
    201,
    "admin rebuilds salary insight aggregates",
  );
  assert.ok(rebuilt.payload.data.rebuilt >= 1);
  assert.ok(await SalaryInsightAggregateModel.countDocuments(), "rebuild should cache aggregates");

  await expectStatus(
    request(baseUrl, "GET", "/dash/v1/salary-insights?limit=10", {
      token: adminTokens.accessToken,
    }),
    200,
    "admin lists salary insight aggregates",
  );
  const health = await expectStatus(
    request(baseUrl, "GET", "/dash/v1/salary-insights/health", {
      token: adminTokens.accessToken,
    }),
    200,
    "admin salary insight health",
  );
  assert.equal(health.payload.data.visible_salary_job_count, 4);

  console.log(
    "Salary insights integration verified for visible salary aggregation, hidden/null exclusion, median/confidence, company fair/below/above checks, public/user/company/admin routes, cache rebuild, and private company data redaction.",
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
