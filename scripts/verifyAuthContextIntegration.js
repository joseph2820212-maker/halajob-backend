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
  const requestHeaders = token
    ? authHeaders(token, headers)
    : {
        Accept: "application/json",
        ...(hasBody ? { "Content-Type": "application/json" } : {}),
        ...headers,
      };
  return fetch(`${baseUrl}${path}`, {
    method,
    headers: requestHeaders,
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

async function expectRefreshTokenCleared(RefreshTokenModel, token, label) {
  const exists = await RefreshTokenModel.exists({ token });
  assert.equal(exists, null, `${label} should delete the refresh token record`);
}

async function main() {
  mongo = await MongoMemoryServer.create({
    instance: {
      dbName: `halajob-auth-context-${nowIso()}`,
    },
  });

  process.env.CONNECTION_URL = mongo.getUri();

  const [{ default: app }, models, tokenService, jwtHelpers] = await Promise.all([
    import("../app.js"),
    import("../models/index.js"),
    import("../services/tokenService.js"),
    import("../utils/jwtHelpers.js"),
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
  const { sign: signJwt } = jwtHelpers;

  await mongoose.connect(process.env.CONNECTION_URL, {
    serverSelectionTimeoutMS: 10000,
  });

  const suffix = nowIso();
  const [employeeRole, companyRole, dashRole] = await RoleModel.create([
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
    {
      log_to: "dash",
      name: `integration-admin-${suffix}`,
      role_number: 1,
      title_ar: "Admin",
      title_en: "Admin",
      status: true,
      is_system: true,
    },
  ]);

  const phoneSeed = suffix.slice(-8);
  const [seekerUser, companyUser, universityUser, otherCompanyUser, pendingCompanyUser, adminUser] = await UserModel.create([
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
    {
      first_name: "Seed",
      last_name: "OtherCompany",
      email: `seed.other.company.${suffix}@example.com`,
      gender: "male",
      role_id: companyRole._id,
      password: "not-used",
      status: true,
      phone_e164: `+1555${phoneSeed}04`,
      phone_country: "US",
      phone_code: "+1",
      phone_national: `555${phoneSeed}04`,
    },
    {
      first_name: "Seed",
      last_name: "PendingCompany",
      email: `seed.pending.company.${suffix}@example.com`,
      gender: "female",
      role_id: companyRole._id,
      password: "not-used",
      status: true,
      phone_e164: `+1555${phoneSeed}05`,
      phone_country: "US",
      phone_code: "+1",
      phone_national: `555${phoneSeed}05`,
    },
    {
      first_name: "Seed",
      last_name: "Admin",
      email: `seed.admin.${suffix}@example.com`,
      gender: "female",
      role_id: dashRole._id,
      password: "not-used",
      status: true,
      phone_e164: `+1555${phoneSeed}06`,
      phone_country: "US",
      phone_code: "+1",
      phone_national: `555${phoneSeed}06`,
    },
  ]);

  const seekerEmployee = await EmployeeModel.create({
    user_id: seekerUser._id,
    role_id: employeeRole._id,
    status: true,
    accepted: true,
    profile_headline: "Integration seeker",
    candidate_stage: "student",
    is_student: true,
    student_profile: {
      university: "Integration University",
      academic_year: "third",
      enrollment_status: "student",
      student_email: universityUser.email,
      student_email_verified: true,
    },
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

  const otherCompany = await CompanyModel.create({
    company_name: `Integration Other Company ${suffix}`,
    company_email: `other.hr.${suffix}@company.example.com`,
    owner_user_id: otherCompanyUser._id,
    role_id: companyRole._id,
    status: true,
    accepted: true,
    can_upload: true,
    is_verified: true,
    profile_completion: 50,
  });

  const pendingCompany = await CompanyModel.create({
    company_name: `Integration Pending Company ${suffix}`,
    company_email: `pending.hr.${suffix}@company.example.com`,
    owner_user_id: pendingCompanyUser._id,
    role_id: companyRole._id,
    status: false,
    accepted: false,
    can_upload: false,
    is_verified: false,
    profile_completion: 10,
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

  const [
    seekerContext,
    studentContext,
    companyContext,
    otherCompanyContext,
    pendingCompanyContext,
    suspendedCompanyContext,
    removedCompanyContext,
    universityContext,
  ] = await AccountContextModel.create([
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
      user_id: seekerUser._id,
      context_key: `student:${seekerEmployee._id}`,
      context_type: "student",
      entity_id: seekerEmployee._id,
      entity_model: "employees",
      display_name: "Integration student",
      status: "active",
      permissions: ["campus.profile.manage", "campus.opportunities.apply", "campus.events.register"],
      is_default: false,
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
      user_id: pendingCompanyUser._id,
      context_key: `company_admin:${pendingCompany._id}`,
      context_type: "company_admin",
      entity_id: pendingCompany._id,
      entity_model: "companies",
      display_name: pendingCompany.company_name,
      status: "pending",
      permissions: ["*"],
      is_default: true,
    },
    {
      user_id: companyUser._id,
      context_key: `company_admin:${company._id}:suspended`,
      context_type: "company_admin",
      entity_id: company._id,
      entity_model: "companies",
      display_name: `${company.company_name} suspended`,
      status: "suspended",
      permissions: ["*"],
      is_default: false,
    },
    {
      user_id: companyUser._id,
      context_key: `company_admin:${company._id}:removed`,
      context_type: "company_admin",
      entity_id: company._id,
      entity_model: "companies",
      display_name: `${company.company_name} removed`,
      status: "removed",
      permissions: ["*"],
      is_default: false,
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
    UserModel.updateOne({ _id: otherCompanyUser._id }, { $set: { default_context_id: otherCompanyContext._id } }),
    UserModel.updateOne({ _id: pendingCompanyUser._id }, { $set: { default_context_id: pendingCompanyContext._id } }),
    UserModel.updateOne({ _id: universityUser._id }, { $set: { default_context_id: universityContext._id } }),
  ]);

  const device = { brand: "test", model_name: "node", is_device: false };
  const [seekerTokens, companyTokens, universityTokens, pendingCompanyTokens, adminTokens] = await Promise.all([
    generateAuthTokens(seekerUser, device),
    generateAuthTokens(companyUser, device),
    generateAuthTokens(universityUser, device),
    generateAuthTokens(pendingCompanyUser, device),
    generateAuthTokens(adminUser, device),
  ]);

  const expiredAt = Math.floor(Date.now() / 1000) - 60;
  const [expiredSeekerAccessToken, expiredAdminAccessToken] = await Promise.all([
    signJwt(
      {
        userId: seekerUser._id,
        loginTime: new Date(),
        exp: expiredAt,
        type: "access",
        jti: `expired-seeker-${suffix}`,
      },
      process.env.JWT_SECRET
    ),
    signJwt(
      {
        userId: adminUser._id,
        loginTime: new Date(),
        exp: expiredAt,
        type: "access",
        jti: `expired-admin-${suffix}`,
      },
      process.env.JWT_SECRET
    ),
  ]);

  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  await expectStatus(
    request(baseUrl, "GET", "/employee/v1/global/jobs"),
    401,
    "missing bearer token should not access employee jobs"
  );

  await expectStatus(
    request(baseUrl, "GET", "/employee/v1/global/jobs", { token: "not-a-valid-jwt" }),
    401,
    "malformed bearer token should not access employee jobs"
  );

  await expectStatus(
    request(baseUrl, "GET", "/employee/v1/global/jobs", { token: expiredSeekerAccessToken }),
    401,
    "expired bearer token should not access employee jobs"
  );

  const seekerJobs = await expectStatus(
    request(baseUrl, "GET", "/employee/v1/global/jobs", { token: seekerTokens.accessToken }),
    200,
    "seeker should access employee jobs"
  );
  assert.equal(seekerJobs.success, true, "seeker jobs response should be successful");

  const studentJobs = await expectStatus(
    request(baseUrl, "GET", "/employee/v1/global/jobs", {
      token: seekerTokens.accessToken,
      headers: {
        "X-Active-Context-Id": String(studentContext._id),
      },
    }),
    200,
    "student context should access employee/student jobs"
  );
  assert.equal(studentJobs.success, true, "student jobs response should be successful");

  const campusStatus = await expectStatus(
    request(baseUrl, "GET", "/campus/v1/student-verifications/me", {
      token: seekerTokens.accessToken,
      headers: {
        "X-Active-Context-Id": String(studentContext._id),
      },
    }),
    200,
    "student context should access campus verification status"
  );
  assert.equal(campusStatus.status, true, "campus verification status response should be successful");

  await UserModel.updateOne(
    { _id: seekerUser._id },
    { $set: { default_context_id: companyContext._id } }
  );
  const seekerJobsWithBorrowedStoredDefault = await expectStatus(
    request(baseUrl, "GET", "/employee/v1/global/jobs", { token: seekerTokens.accessToken }),
    200,
    "tampered cross-user stored default context should not block own seeker access"
  );
  assert.equal(
    seekerJobsWithBorrowedStoredDefault.success,
    true,
    "seeker should still resolve an owned active context after a tampered stored default"
  );
  const seekerAfterBorrowedStoredDefault = await UserModel.findById(seekerUser._id).lean();
  assert.notEqual(
    String(seekerAfterBorrowedStoredDefault.default_context_id || ""),
    String(companyContext._id),
    "cross-user stored default context should be replaced with an owned active context"
  );
  await expectStatus(
    request(baseUrl, "GET", "/company/v1/global", { token: seekerTokens.accessToken }),
    403,
    "tampered cross-user stored default context should not grant company dashboard access"
  );

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

  await UserModel.updateOne(
    { _id: companyUser._id },
    { $set: { default_context_id: removedCompanyContext._id } }
  );
  const companyDashboardWithRemovedStoredDefault = await expectStatus(
    request(baseUrl, "GET", "/company/v1/global", { token: companyTokens.accessToken }),
    200,
    "removed stored default context should be ignored in favor of active company context"
  );
  assert.equal(
    companyDashboardWithRemovedStoredDefault.success,
    true,
    "company should still resolve an owned active context after a removed stored default"
  );
  const companyAfterRemovedStoredDefault = await UserModel.findById(companyUser._id).lean();
  assert.notEqual(
    String(companyAfterRemovedStoredDefault.default_context_id || ""),
    String(removedCompanyContext._id),
    "removed stored default context should be replaced with an active context"
  );

  await expectStatus(
    request(baseUrl, "GET", "/company/v1/global", { token: pendingCompanyTokens.accessToken }),
    403,
    "pending company context should not access approved company dashboard"
  );

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

  await expectStatus(
    request(baseUrl, "GET", "/company/v1/global", {
      token: companyTokens.accessToken,
      headers: {
        "X-Active-Context-Id": String(otherCompanyContext._id),
      },
    }),
    403,
    "company user should not borrow another company's context by header"
  );

  await expectStatus(
    request(baseUrl, "GET", "/company/v1/global", {
      token: companyTokens.accessToken,
      headers: {
        "X-Active-Context-Id": String(suspendedCompanyContext._id),
      },
    }),
    403,
    "suspended explicit context should fail closed instead of falling back"
  );

  await expectStatus(
    request(baseUrl, "GET", "/company/v1/global", {
      token: companyTokens.accessToken,
      headers: {
        "X-Active-Context-Id": String(removedCompanyContext._id),
      },
    }),
    403,
    "removed explicit context should fail closed instead of falling back"
  );

  await expectStatus(
    request(baseUrl, "POST", "/user/v1/me/active-context", {
      token: companyTokens.accessToken,
      body: {
        context_id: String(otherCompanyContext._id),
      },
    }),
    404,
    "another user's context should not be selectable as active context"
  );

  await expectStatus(
    request(baseUrl, "POST", "/user/v1/me/active-context", {
      token: companyTokens.accessToken,
      body: {
        context_id: String(removedCompanyContext._id),
      },
    }),
    404,
    "removed context should not be selectable as active context"
  );

  await expectStatus(
    request(baseUrl, "GET", "/company/v1/global", {
      token: companyTokens.accessToken,
      headers: {
        "X-Active-Context-Id": "not-a-context-id",
      },
    }),
    400,
    "invalid explicit context id should fail closed"
  );

  await expectStatus(
    request(baseUrl, "GET", "/dash/v1/dashboard"),
    401,
    "missing bearer token should not access admin dashboard"
  );

  await expectStatus(
    request(baseUrl, "GET", "/dash/v1/dashboard", { token: seekerTokens.accessToken }),
    403,
    "seeker role should not access admin dashboard"
  );

  await expectStatus(
    request(baseUrl, "GET", "/dash/v1/dashboard", { token: expiredAdminAccessToken }),
    401,
    "expired admin bearer token should not access admin dashboard"
  );

  const adminDashboard = await expectStatus(
    request(baseUrl, "GET", "/dash/v1/dashboard", { token: adminTokens.accessToken }),
    200,
    "dash role should access admin dashboard"
  );
  assert.equal(adminDashboard.status, true, "admin dashboard response should be successful");

  const appLogoutTokens = await generateAuthTokens(seekerUser, {
    brand: "logout-app",
    model_name: "node",
    is_device: false,
  });
  await expectStatus(
    request(baseUrl, "POST", "/user/v1/auth/logout", {
      body: { refreshToken: appLogoutTokens.refreshToken },
    }),
    200,
    "app logout should accept a valid refresh token"
  );
  await expectRefreshTokenCleared(
    RefreshTokenModel,
    appLogoutTokens.refreshToken,
    "app logout"
  );
  await expectStatus(
    request(baseUrl, "GET", "/employee/v1/global/jobs", { token: appLogoutTokens.accessToken }),
    403,
    "app logout should invalidate the old access token"
  );
  await expectStatus(
    request(baseUrl, "POST", "/user/v1/auth/refresh-token", {
      body: { refreshToken: appLogoutTokens.refreshToken },
    }),
    403,
    "app logout should reject reuse of the logged-out refresh token"
  );

  const companyLogoutTokens = await generateAuthTokens(companyUser, {
    brand: "logout-company",
    model_name: "node",
    is_device: false,
  });
  await expectStatus(
    request(baseUrl, "POST", "/company/v1/auth/logout", {
      body: { refreshToken: companyLogoutTokens.refreshToken },
    }),
    200,
    "company logout should accept a valid refresh token"
  );
  await expectRefreshTokenCleared(
    RefreshTokenModel,
    companyLogoutTokens.refreshToken,
    "company logout"
  );
  await expectStatus(
    request(baseUrl, "GET", "/company/v1/global", { token: companyLogoutTokens.accessToken }),
    403,
    "company logout should invalidate the old access token"
  );

  const adminLogoutTokens = await generateAuthTokens(adminUser, {
    brand: "logout-admin",
    model_name: "node",
    is_device: false,
  });
  await expectStatus(
    request(baseUrl, "POST", "/dash/v1/auth/logout", {
      body: { refreshToken: adminLogoutTokens.refreshToken },
    }),
    200,
    "admin logout should accept a valid refresh token"
  );
  await expectRefreshTokenCleared(
    RefreshTokenModel,
    adminLogoutTokens.refreshToken,
    "admin logout"
  );
  await expectStatus(
    request(baseUrl, "GET", "/dash/v1/dashboard", { token: adminLogoutTokens.accessToken }),
    403,
    "admin logout should invalidate the old access token"
  );
  await expectStatus(
    request(baseUrl, "POST", "/dash/v1/auth/refresh", {
      body: { refreshToken: adminLogoutTokens.refreshToken },
    }),
    403,
    "admin logout should reject reuse of the logged-out refresh token"
  );

  await UserModel.updateOne({ _id: seekerUser._id }, { $set: { status: false } });
  await expectStatus(
    request(baseUrl, "GET", "/employee/v1/global/jobs", { token: seekerTokens.accessToken }),
    403,
    "inactive app user should not access employee jobs"
  );
  await UserModel.updateOne({ _id: seekerUser._id }, { $set: { status: true } });

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
