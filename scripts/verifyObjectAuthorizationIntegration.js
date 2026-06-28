import assert from "node:assert/strict";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET ||= "object-authorization-integration-secret";
process.env.ACCESS_TOKEN_EXPIRATION_MINUTES ||= "30";
process.env.REFRESH_TOKEN_EXPIRATION_DAYS ||= "30";
process.env.HEALTH_SECRET ||= "object-authorization-health-secret";

let mongo;
let server;

const nowIso = () => new Date().toISOString().replace(/[-:.TZ]/g, "");
const objectId = () => new mongoose.Types.ObjectId();

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
    headers: token
      ? authHeaders(token, headers)
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
  assert.equal(response.status, expected, `${label} should return ${expected}; got ${response.status}`);
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
    phone_e164: `+1555${phone}`,
    phone_country: "US",
    phone_code: "+1",
    phone_national: `555${phone}`,
  };
}

function companySeed({ name, email, ownerUserId, roleId }) {
  return {
    company_name: name,
    company_email: email,
    owner_user_id: ownerUserId,
    role_id: roleId,
    status: true,
    accepted: true,
    can_upload: true,
    is_verified: true,
    profile_completion: 75,
  };
}

function jobSeed({ jobId, company, companyUser, suffix }) {
  return {
    _id: jobId,
    job_name: `Object Authorization Engineer ${suffix}`,
    ref: `OBJ-${String(jobId).slice(-10)}`,
    description:
      "This seeded job has enough description length to satisfy validation while proving object-level authorization boundaries.",
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
      min: 1000,
      max: 2000,
    },
    company_id: company._id,
    user_id: companyUser._id,
  };
}

function applicationSeed({ seekerUser, seekerEmployee, job, company, countryId, suffix }) {
  return {
    user_id: seekerUser._id,
    employee_id: seekerEmployee._id,
    job_id: job._id,
    company_id: company._id,
    first_name: "Object",
    last_name: "Seeker",
    email: `object.seeker.${suffix}@example.com`,
    phone_code: "+1",
    phone_national: `555${suffix.slice(-8)}99`,
    country_id: countryId,
    status: "new",
    source: "app",
  };
}

async function main() {
  mongo = await MongoMemoryServer.create({
    instance: {
      dbName: `halajob-object-authorization-${nowIso()}`,
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
    AuditLogModel,
    CampusEventRegistrationModel,
    CompanyModel,
    EmployeeModel,
    RoleModel,
    StudentVerificationModel,
    UniversityMembershipModel,
    UniversityModel,
    UserApplyingJobModel,
    UserModel,
    jobsModel,
  } = models;
  const { generateAuthTokens } = tokenService;

  await mongoose.connect(process.env.CONNECTION_URL, {
    serverSelectionTimeoutMS: 10000,
  });

  const suffix = nowIso();
  const phoneSeed = suffix.slice(-8);
  const [employeeRole, companyRole] = await RoleModel.create([
    {
      log_to: "employee",
      name: `object-auth-employee-${suffix}`,
      role_number: 950001,
      title_ar: "Employee",
      title_en: "Employee",
      status: true,
      is_system: true,
    },
    {
      log_to: "company",
      name: `object-auth-company-${suffix}`,
      role_number: 950002,
      title_ar: "Company",
      title_en: "Company",
      status: true,
      is_system: true,
    },
  ]);

  const [companyUserA, companyUserB, universityUserA, universityUserB, seekerUser, studentUserA, studentUserB] =
    await UserModel.create([
      userSeed({
        firstName: "Company",
        lastName: "Alpha",
        email: `object.company.alpha.${suffix}@example.com`,
        roleId: companyRole._id,
        phone: `${phoneSeed}01`,
      }),
      userSeed({
        firstName: "Company",
        lastName: "Beta",
        email: `object.company.beta.${suffix}@example.com`,
        roleId: companyRole._id,
        phone: `${phoneSeed}02`,
      }),
      userSeed({
        firstName: "University",
        lastName: "Alpha",
        email: `object.university.alpha.${suffix}@example.edu`,
        roleId: employeeRole._id,
        phone: `${phoneSeed}03`,
      }),
      userSeed({
        firstName: "University",
        lastName: "Beta",
        email: `object.university.beta.${suffix}@example.edu`,
        roleId: employeeRole._id,
        phone: `${phoneSeed}04`,
      }),
      userSeed({
        firstName: "Object",
        lastName: "Seeker",
        email: `object.seeker.${suffix}@example.com`,
        roleId: employeeRole._id,
        phone: `${phoneSeed}05`,
      }),
      userSeed({
        firstName: "Student",
        lastName: "Alpha",
        email: `object.student.alpha.${suffix}@alpha.edu`,
        roleId: employeeRole._id,
        phone: `${phoneSeed}06`,
      }),
      userSeed({
        firstName: "Student",
        lastName: "Beta",
        email: `object.student.beta.${suffix}@beta.edu`,
        roleId: employeeRole._id,
        phone: `${phoneSeed}07`,
      }),
    ]);

  const [seekerEmployee, studentEmployeeA, studentEmployeeB] = await EmployeeModel.create([
    {
      user_id: seekerUser._id,
      role_id: employeeRole._id,
      status: true,
      accepted: true,
      profile_headline: "Object authorization seeker",
    },
    {
      user_id: studentUserA._id,
      role_id: employeeRole._id,
      status: true,
      accepted: true,
      is_student: true,
      candidate_stage: "student",
      profile_headline: "Alpha student",
    },
    {
      user_id: studentUserB._id,
      role_id: employeeRole._id,
      status: true,
      accepted: true,
      is_student: true,
      candidate_stage: "student",
      profile_headline: "Beta student",
    },
  ]);

  const [companyA, companyB] = await CompanyModel.create([
    companySeed({
      name: `Object Auth Alpha ${suffix}`,
      email: `alpha.${suffix}@company.example.com`,
      ownerUserId: companyUserA._id,
      roleId: companyRole._id,
    }),
    companySeed({
      name: `Object Auth Beta ${suffix}`,
      email: `beta.${suffix}@company.example.com`,
      ownerUserId: companyUserB._id,
      roleId: companyRole._id,
    }),
  ]);

  const [universityA, universityB] = await UniversityModel.create([
    {
      name: `Object University Alpha ${suffix}`,
      name_en: `Object University Alpha ${suffix}`,
      email_domain: `alpha-${suffix}.edu`,
      career_center_email: universityUserA.email,
      verified: true,
      status: "active",
    },
    {
      name: `Object University Beta ${suffix}`,
      name_en: `Object University Beta ${suffix}`,
      email_domain: `beta-${suffix}.edu`,
      career_center_email: universityUserB.email,
      verified: true,
      status: "active",
    },
  ]);

  await UniversityMembershipModel.create([
    {
      university_id: universityA._id,
      user_id: universityUserA._id,
      role: "owner",
      permissions: ["campus.verifications.manage", "campus.dashboard.view"],
      status: "active",
      accepted_at: new Date(),
    },
    {
      university_id: universityB._id,
      user_id: universityUserB._id,
      role: "owner",
      permissions: ["campus.verifications.manage", "campus.dashboard.view"],
      status: "active",
      accepted_at: new Date(),
    },
  ]);

  const [companyContextA, companyContextB, universityContextA, universityContextB, studentContextA, studentContextB] =
    await AccountContextModel.create([
    {
      user_id: companyUserA._id,
      context_key: `company_admin:${companyA._id}`,
      context_type: "company_admin",
      entity_id: companyA._id,
      entity_model: "companies",
      display_name: companyA.company_name,
      status: "active",
      permissions: ["*"],
      is_default: true,
    },
    {
      user_id: companyUserB._id,
      context_key: `company_admin:${companyB._id}`,
      context_type: "company_admin",
      entity_id: companyB._id,
      entity_model: "companies",
      display_name: companyB.company_name,
      status: "active",
      permissions: ["*"],
      is_default: true,
    },
    {
      user_id: universityUserA._id,
      context_key: `university_admin:${universityA._id}`,
      context_type: "university_admin",
      entity_id: universityA._id,
      entity_model: "universities",
      display_name: universityA.name,
      status: "active",
      permissions: ["campus.verifications.manage", "campus.dashboard.view"],
      is_default: true,
    },
    {
      user_id: universityUserB._id,
      context_key: `university_admin:${universityB._id}`,
      context_type: "university_admin",
      entity_id: universityB._id,
      entity_model: "universities",
      display_name: universityB.name,
      status: "active",
      permissions: ["campus.verifications.manage", "campus.dashboard.view"],
      is_default: true,
    },
    {
      user_id: studentUserA._id,
      context_key: `student:${studentEmployeeA._id}`,
      context_type: "student",
      entity_id: studentEmployeeA._id,
      entity_model: "employees",
      display_name: "Alpha student",
      status: "active",
      permissions: ["campus.profile.manage", "campus.opportunities.apply", "campus.events.register"],
      is_default: true,
    },
    {
      user_id: studentUserB._id,
      context_key: `student:${studentEmployeeB._id}`,
      context_type: "student",
      entity_id: studentEmployeeB._id,
      entity_model: "employees",
      display_name: "Beta student",
      status: "active",
      permissions: ["campus.profile.manage", "campus.opportunities.apply", "campus.events.register"],
      is_default: true,
    },
  ]);

  await Promise.all([
    UserModel.updateOne({ _id: companyUserA._id }, { $set: { default_context_id: companyContextA._id } }),
    UserModel.updateOne({ _id: companyUserB._id }, { $set: { default_context_id: companyContextB._id } }),
    UserModel.updateOne({ _id: universityUserA._id }, { $set: { default_context_id: universityContextA._id } }),
    UserModel.updateOne({ _id: universityUserB._id }, { $set: { default_context_id: universityContextB._id } }),
    UserModel.updateOne({ _id: studentUserA._id }, { $set: { default_context_id: studentContextA._id } }),
    UserModel.updateOne({ _id: studentUserB._id }, { $set: { default_context_id: studentContextB._id } }),
  ]);

  const [jobA, jobB] = await jobsModel.create([
    jobSeed({ jobId: objectId(), company: companyA, companyUser: companyUserA, suffix: `Alpha ${suffix}` }),
    jobSeed({ jobId: objectId(), company: companyB, companyUser: companyUserB, suffix: `Beta ${suffix}` }),
  ]);

  const countryId = objectId();
  const [applicationA, applicationB] = await UserApplyingJobModel.create([
    applicationSeed({ seekerUser, seekerEmployee, job: jobA, company: companyA, countryId, suffix: `${suffix}a` }),
    applicationSeed({ seekerUser, seekerEmployee, job: jobB, company: companyB, countryId, suffix: `${suffix}b` }),
  ]);

  const [campusApplicationA, campusApplicationB] = await UserApplyingJobModel.create([
    applicationSeed({
      seekerUser: studentUserA,
      seekerEmployee: studentEmployeeA,
      job: jobA,
      company: companyA,
      countryId,
      suffix: `${suffix}campusa`,
    }),
    applicationSeed({
      seekerUser: studentUserB,
      seekerEmployee: studentEmployeeB,
      job: jobB,
      company: companyB,
      countryId,
      suffix: `${suffix}campusb`,
    }),
  ]);

  const eventIdA = `campus-event-alpha-${suffix}`;
  const eventIdB = `campus-event-beta-${suffix}`;
  await CampusEventRegistrationModel.create([
    {
      user_id: studentUserA._id,
      employee_id: studentEmployeeA._id,
      event_id: eventIdA,
      title: "Alpha campus event",
      organizer: "Alpha career center",
      kind: "workshop",
      date_label: "Today",
      start_at: new Date(Date.now() + 60 * 60 * 1000),
      mode: "online",
      status: "registered",
    },
    {
      user_id: studentUserB._id,
      employee_id: studentEmployeeB._id,
      event_id: eventIdB,
      title: "Beta campus event",
      organizer: "Beta career center",
      kind: "workshop",
      date_label: "Tomorrow",
      start_at: new Date(Date.now() + 2 * 60 * 60 * 1000),
      mode: "online",
      status: "registered",
    },
  ]);

  const [verificationA, verificationB] = await StudentVerificationModel.create([
    {
      user_id: studentUserA._id,
      employee_id: studentEmployeeA._id,
      university_id: universityA._id,
      method: "manual",
      status: "pending",
      student_email: studentUserA.email,
      faculty_major: "Computer Science",
      degree_level: "bachelor",
      graduation_year: 2027,
    },
    {
      user_id: studentUserB._id,
      employee_id: studentEmployeeB._id,
      university_id: universityB._id,
      method: "manual",
      status: "pending",
      student_email: studentUserB.email,
      faculty_major: "Business",
      degree_level: "bachelor",
      graduation_year: 2028,
    },
  ]);

  const device = { brand: "test", model_name: "node", is_device: false };
  const [companyTokensA, companyTokensB, universityTokensA, studentTokensA] = await Promise.all([
    generateAuthTokens(companyUserA, device),
    generateAuthTokens(companyUserB, device),
    generateAuthTokens(universityUserA, device),
    generateAuthTokens(studentUserA, device),
  ]);

  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  const studentAHeaders = { "X-Active-Context-Id": String(studentContextA._id) };

  const campusApplicationsA = await expectStatus(
    request(baseUrl, "GET", "/user/v1/campus/applications", {
      token: studentTokensA.accessToken,
      headers: studentAHeaders,
    }),
    200,
    "student A should list own campus applications"
  );
  const campusApplicationIds = (campusApplicationsA.data || []).map((item) => String(item.id || item._id || ""));
  assert.ok(
    campusApplicationIds.includes(String(campusApplicationA._id)),
    "student A application list should include student A application"
  );
  assert.ok(
    !campusApplicationIds.includes(String(campusApplicationB._id)),
    "student A application list must not include student B application"
  );

  await expectStatus(
    request(baseUrl, "GET", `/user/v1/campus/applications/${campusApplicationA._id}`, {
      token: studentTokensA.accessToken,
      headers: studentAHeaders,
    }),
    200,
    "student A should read own campus application"
  );

  await expectStatus(
    request(baseUrl, "GET", `/user/v1/campus/applications/${campusApplicationB._id}`, {
      token: studentTokensA.accessToken,
      headers: studentAHeaders,
    }),
    404,
    "student A should not read student B campus application"
  );

  await expectStatus(
    request(baseUrl, "POST", `/user/v1/campus/applications/${campusApplicationB._id}/messages`, {
      token: studentTokensA.accessToken,
      headers: studentAHeaders,
      body: { message: "This must not reach another student application." },
    }),
    404,
    "student A should not message student B campus application"
  );

  await expectStatus(
    request(baseUrl, "PATCH", `/user/v1/campus/applications/${campusApplicationB._id}/cancel`, {
      token: studentTokensA.accessToken,
      headers: studentAHeaders,
      body: { note: "This must not cancel another student application." },
    }),
    404,
    "student A should not cancel student B campus application"
  );

  const campusApplicationBAfterDenied = await UserApplyingJobModel.findById(campusApplicationB._id).lean();
  assert.equal(
    campusApplicationBAfterDenied.status,
    "new",
    "cross-student campus cancellation attempt must not mutate the target application"
  );
  assert.equal(
    (campusApplicationBAfterDenied.communication_log || []).length,
    0,
    "cross-student campus message attempt must not add target messages"
  );

  await expectStatus(
    request(baseUrl, "POST", `/user/v1/campus/applications/${campusApplicationA._id}/messages`, {
      token: studentTokensA.accessToken,
      headers: studentAHeaders,
      body: { message: "Can I share an updated portfolio before interview?" },
    }),
    200,
    "student A should message own campus application"
  );

  await expectStatus(
    request(baseUrl, "PATCH", `/user/v1/campus/applications/${campusApplicationA._id}/cancel`, {
      token: studentTokensA.accessToken,
      headers: studentAHeaders,
      body: { note: "Student A withdrew intentionally." },
    }),
    200,
    "student A should cancel own campus application"
  );

  const campusApplicationAAfterAllowed = await UserApplyingJobModel.findById(campusApplicationA._id).lean();
  assert.equal(campusApplicationAAfterAllowed.status, "withdrawn", "own campus application cancellation should persist");
  assert.equal(
    (campusApplicationAAfterAllowed.communication_log || []).length,
    1,
    "own campus application message should persist"
  );

  const campusEventsA = await expectStatus(
    request(baseUrl, "GET", "/user/v1/campus/events", {
      token: studentTokensA.accessToken,
      headers: studentAHeaders,
    }),
    200,
    "student A should list own campus event registrations"
  );
  const registeredEventIds = campusEventsA.data?.registered_event_ids || [];
  assert.ok(registeredEventIds.includes(eventIdA), "student A events should include own registration");
  assert.ok(!registeredEventIds.includes(eventIdB), "student A events must not include student B registration");

  await expectStatus(
    request(baseUrl, "PATCH", `/user/v1/campus/events/${eventIdB}/cancel`, {
      token: studentTokensA.accessToken,
      headers: studentAHeaders,
      body: {},
    }),
    404,
    "student A should not cancel student B campus event registration"
  );

  const eventBAfterDenied = await CampusEventRegistrationModel.findOne({
    user_id: studentUserB._id,
    event_id: eventIdB,
  }).lean();
  assert.equal(eventBAfterDenied.status, "registered", "cross-student event cancellation must not mutate target event");

  await expectStatus(
    request(baseUrl, "PATCH", `/user/v1/campus/events/${eventIdA}/cancel`, {
      token: studentTokensA.accessToken,
      headers: studentAHeaders,
      body: {},
    }),
    200,
    "student A should cancel own campus event registration"
  );

  const eventAAfterAllowed = await CampusEventRegistrationModel.findOne({
    user_id: studentUserA._id,
    event_id: eventIdA,
  }).lean();
  assert.equal(eventAAfterAllowed.status, "cancelled", "own campus event cancellation should persist");

  await expectStatus(
    request(baseUrl, "GET", `/company/v1/global/jobs/${jobA._id}`, {
      token: companyTokensA.accessToken,
    }),
    200,
    "owning company should read its own job"
  );

  await expectStatus(
    request(baseUrl, "GET", `/company/v1/jobs/hiring/applications/${applicationA._id}`, {
      token: companyTokensA.accessToken,
    }),
    200,
    "owning company should read its own application"
  );

  await expectStatus(
    request(baseUrl, "GET", `/company/v1/global/jobs/${jobB._id}`, {
      token: companyTokensA.accessToken,
    }),
    404,
    "company should not read another company's job"
  );

  await expectStatus(
    request(baseUrl, "PATCH", `/company/v1/global/jobs/${jobB._id}/status`, {
      token: companyTokensA.accessToken,
      body: { status: false },
    }),
    404,
    "company should not mutate another company's job status"
  );

  await expectStatus(
    request(baseUrl, "GET", `/company/v1/jobs/hiring/applications/${applicationB._id}`, {
      token: companyTokensA.accessToken,
    }),
    404,
    "company should not read another company's application"
  );

  await expectStatus(
    request(baseUrl, "PATCH", `/company/v1/jobs/hiring/applications/${applicationB._id}/status`, {
      token: companyTokensA.accessToken,
      body: { status: "shortlisted" },
    }),
    404,
    "company should not mutate another company's application"
  );

  const jobBAfterDenied = await jobsModel.findById(jobB._id).lean();
  assert.equal(jobBAfterDenied.status, true, "cross-company job status attempt must not mutate the target job");

  const applicationBAfterDenied = await UserApplyingJobModel.findById(applicationB._id).lean();
  assert.equal(
    applicationBAfterDenied.status,
    "new",
    "cross-company application status attempt must not mutate the target application"
  );

  const queueA = await expectStatus(
    request(baseUrl, "GET", "/campus/v1/admin/verifications", {
      token: universityTokensA.accessToken,
    }),
    200,
    "university admin should list its own verification queue"
  );
  const queueIds = (queueA.data || []).map((item) => String(item.id || item._id || ""));
  assert.ok(queueIds.includes(String(verificationA._id)), "university A queue should include university A verification");
  assert.ok(!queueIds.includes(String(verificationB._id)), "university A queue must not include university B verification");

  await expectStatus(
    request(baseUrl, "POST", `/campus/v1/admin/verifications/${verificationB._id}/approve`, {
      token: universityTokensA.accessToken,
      body: {},
    }),
    404,
    "university admin should not approve another university's verification"
  );

  const verificationBAfterDenied = await StudentVerificationModel.findById(verificationB._id).lean();
  assert.equal(
    verificationBAfterDenied.status,
    "pending",
    "cross-university approval attempt must not mutate the target verification"
  );

  await expectStatus(
    request(baseUrl, "PATCH", `/company/v1/global/jobs/${jobA._id}/pause`, {
      token: companyTokensA.accessToken,
      body: {},
    }),
    200,
    "owning company should pause its own job"
  );

  await expectStatus(
    request(baseUrl, "PATCH", `/company/v1/jobs/hiring/applications/${applicationA._id}/status`, {
      token: companyTokensA.accessToken,
      body: { status: "shortlisted", note: "Object authorization positive path" },
    }),
    200,
    "owning company should mutate its own application status"
  );

  await expectStatus(
    request(baseUrl, "POST", `/campus/v1/admin/verifications/${verificationA._id}/approve`, {
      token: universityTokensA.accessToken,
      body: {},
    }),
    200,
    "university admin should approve its own university verification"
  );

  const [jobAAfterAllowed, applicationAAfterAllowed, verificationAAfterAllowed] = await Promise.all([
    jobsModel.findById(jobA._id).lean(),
    UserApplyingJobModel.findById(applicationA._id).lean(),
    StudentVerificationModel.findById(verificationA._id).lean(),
  ]);

  assert.equal(jobAAfterAllowed.publish_status, "paused", "owning company job pause should persist");
  assert.equal(applicationAAfterAllowed.status, "shortlisted", "owning company application update should persist");
  assert.equal(verificationAAfterAllowed.status, "verified", "own university verification approval should persist");

  const deniedAuditCount = await AuditLogModel.countDocuments({
    $or: [
      { entity_id: jobB._id },
      { entity_id: applicationB._id },
      { entity_id: verificationB._id },
    ],
  });
  assert.equal(deniedAuditCount, 0, "denied cross-object attempts must not create success audit rows");

  const allowedAuditCount = await AuditLogModel.countDocuments({
    $or: [
      { entity_id: jobA._id, action: "job_paused" },
      { entity_id: applicationA._id, action: "application_status_changed" },
      { entity_id: verificationA._id, action: "campus_verification_approved" },
    ],
  });
  assert.equal(allowedAuditCount, 3, "allowed object actions should create the expected audit rows");

  await expectStatus(
    request(baseUrl, "GET", `/company/v1/global/jobs/${jobA._id}`, {
      token: companyTokensB.accessToken,
    }),
    404,
    "company B should not read company A job either"
  );

  console.log("Object authorization integration verified for company, university, and campus student scoped records.");
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
