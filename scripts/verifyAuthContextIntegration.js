import assert from "node:assert/strict";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET ||= "auth-context-integration-secret";
process.env.ACCESS_TOKEN_EXPIRATION_MINUTES ||= "30";
process.env.REFRESH_TOKEN_EXPIRATION_DAYS ||= "30";
process.env.HEALTH_SECRET ||= "auth-context-health-secret";

let mongo;
let server;

const nowIso = () => new Date().toISOString().replace(/[-:.TZ]/g, "");

function authHeaders(token, extra = {}) {
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...extra,
  };
}

async function request(baseUrl, method, path, { token, headers, body } = {}) {
  const hasBody = !["GET", "HEAD"].includes(method);
  return fetch(`${baseUrl}${path}`, {
    method,
    headers: token ? authHeaders(token, headers) : { Accept: "application/json", ...headers },
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
  assert.equal(response.status, expected, `${label} should return ${expected}; got ${response.status}`);
  return payload;
}

async function main() {
  mongo = await MongoMemoryServer.create({
    instance: {
      dbName: `halajob-auth-context-${nowIso()}`,
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
    EmployeeModel,
    RefreshTokenModel,
    RoleModel,
    UniversityMembershipModel,
    UniversityModel,
    UserModel,
  } = models;
  const { generateAuthTokens } = tokenService;

  await mongoose.connect(process.env.CONNECTION_URL, {
    serverSelectionTimeoutMS: 10000,
  });

  const suffix = nowIso();
  const [employeeRole, companyRole] = await RoleModel.create([
    {
      log_to: "employee",
      name: `integration-employee-${suffix}`,
      role_number: 910001,
      title_ar: "Employee",
      title_en: "Employee",
      status: true,
      is_system: true,
    },
    {
      log_to: "company",
      name: `integration-company-${suffix}`,
      role_number: 910002,
      title_ar: "Company",
      title_en: "Company",
      status: true,
      is_system: true,
    },
  ]);

  const phoneSeed = suffix.slice(-8);
  const [seekerUser, companyUser, universityUser] = await UserModel.create([
    {
      first_name: "Seed",
      last_name: "Seeker",
      email: `seed.seeker.${suffix}@example.com`,
      gender: "male",
      role_id: employeeRole._id,
      password: "not-used",
      status: true,
      phone_e164: `+1555${phoneSeed}01`,
      phone_country: "US",
      phone_code: "+1",
      phone_national: `555${phoneSeed}01`,
    },
    {
      first_name: "Seed",
      last_name: "Company",
      email: `seed.company.${suffix}@example.com`,
      gender: "male",
      role_id: companyRole._id,
      password: "not-used",
      status: true,
      phone_e164: `+1555${phoneSeed}02`,
      phone_country: "US",
      phone_code: "+1",
      phone_national: `555${phoneSeed}02`,
    },
    {
      first_name: "Seed",
      last_name: "University",
      email: `seed.university.${suffix}@example.edu`,
      gender: "female",
      role_id: employeeRole._id,
      password: "not-used",
      status: true,
      phone_e164: `+1555${phoneSeed}03`,
      phone_country: "US",
      phone_code: "+1",
      phone_national: `555${phoneSeed}03`,
    },
  ]);

  const seekerEmployee = await EmployeeModel.create({
    user_id: seekerUser._id,
    role_id: employeeRole._id,
    status: true,
    accepted: true,
    profile_headline: "Integration seeker",
    candidate_stage: "experienced",
  });

  const company = await CompanyModel.create({
    company_name: `Integration Company ${suffix}`,
    company_email: `hr.${suffix}@company.example.com`,
    owner_user_id: companyUser._id,
    role_id: companyRole._id,
    status: true,
    accepted: true,
    can_upload: true,
    is_verified: true,
    profile_completion: 50,
  });

  const university = await UniversityModel.create({
    name: `Integration University ${suffix}`,
    name_en: `Integration University ${suffix}`,
    email_domain: `integration-${suffix}.edu`,
    career_center_email: universityUser.email,
    verified: true,
    status: "active",
  });

  await UniversityMembershipModel.create({
    university_id: university._id,
    user_id: universityUser._id,
    role: "owner",
    permissions: ["campus.verifications.manage", "campus.dashboard.view"],
    status: "active",
    accepted_at: new Date(),
  });

  const [seekerContext, companyContext, universityContext] = await AccountContextModel.create([
    {
      user_id: seekerUser._id,
      context_key: `job_seeker:${seekerEmployee._id}`,
      context_type: "job_seeker",
      entity_id: seekerEmployee._id,
      entity_model: "employees",
      display_name: "Integration seeker",
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
    {
      user_id: universityUser._id,
      context_key: `university_admin:${university._id}`,
      context_type: "university_admin",
      entity_id: university._id,
      entity_model: "universities",
      display_name: university.name,
      status: "active",
      permissions: ["campus.verifications.manage", "campus.dashboard.view"],
      is_default: true,
    },
  ]);

  await Promise.all([
    UserModel.updateOne({ _id: seekerUser._id }, { $set: { default_context_id: seekerContext._id } }),
    UserModel.updateOne({ _id: companyUser._id }, { $set: { default_context_id: companyContext._id } }),
    UserModel.updateOne({ _id: universityUser._id }, { $set: { default_context_id: universityContext._id } }),
  ]);

  const device = { brand: "test", model_name: "node", is_device: false };
  const [seekerTokens, companyTokens, universityTokens] = await Promise.all([
    generateAuthTokens(seekerUser, device),
    generateAuthTokens(companyUser, device),
    generateAuthTokens(universityUser, device),
  ]);

  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  const seekerJobs = await expectStatus(
    request(baseUrl, "GET", "/employee/v1/global/jobs", { token: seekerTokens.accessToken }),
    200,
    "seeker should access employee jobs"
  );
  assert.equal(seekerJobs.success, true, "seeker jobs response should be successful");

  const companyBlockedFromEmployee = await expectStatus(
    request(baseUrl, "GET", "/employee/v1/global/jobs", { token: companyTokens.accessToken }),
    403,
    "company context should not access employee global jobs"
  );
  assert.match(
    String(companyBlockedFromEmployee.message || ""),
    /employee|active_context_required/i,
    "company blocked from employee route should explain employee/context requirement"
  );

  await expectStatus(
    request(baseUrl, "GET", "/employee/v1/companies", { token: companyTokens.accessToken }),
    403,
    "company context should not access legacy employee company alias"
  );

  await expectStatus(
    request(baseUrl, "GET", "/company/v1/global", { token: seekerTokens.accessToken }),
    403,
    "seeker context should not access company dashboard"
  );

  const companyDashboard = await expectStatus(
    request(baseUrl, "GET", "/company/v1/global", { token: companyTokens.accessToken }),
    200,
    "company context should access company dashboard"
  );
  assert.equal(companyDashboard.success, true, "company dashboard response should be successful");

  await expectStatus(
    request(baseUrl, "GET", "/university/v1/dashboard", { token: companyTokens.accessToken }),
    403,
    "company context should not access university dashboard"
  );

  const universityDashboard = await expectStatus(
    request(baseUrl, "GET", "/university/v1/dashboard", { token: universityTokens.accessToken }),
    200,
    "university context should access university dashboard"
  );
  assert.equal(universityDashboard.status, true, "university dashboard response should be successful");

  await expectStatus(
    request(baseUrl, "GET", "/company/v1/global", {
      token: seekerTokens.accessToken,
      headers: {
        "X-Active-Context-Id": String(companyContext._id),
      },
    }),
    403,
    "user should not borrow another account context by header"
  );

  await RefreshTokenModel.deleteMany({ userRef: String(seekerUser._id) });

  await expectStatus(
    request(baseUrl, "GET", "/employee/v1/global/jobs", { token: seekerTokens.accessToken }),
    403,
    "revoked refresh session should invalidate access token"
  );

  console.log("Auth/context integration verified with seeded MongoDB data.");
}

try {
  await main();
} finally {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase().catch(() => {});
    await mongoose.disconnect();
  }
  if (mongo) {
    await mongo.stop();
  }
}
