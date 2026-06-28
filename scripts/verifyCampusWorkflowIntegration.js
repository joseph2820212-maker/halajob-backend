import assert from "node:assert/strict";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET ||= "campus-workflow-integration-secret";
process.env.ACCESS_TOKEN_EXPIRATION_MINUTES ||= "30";
process.env.REFRESH_TOKEN_EXPIRATION_DAYS ||= "30";
process.env.HEALTH_SECRET ||= "campus-workflow-health-secret";

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

async function expectRawStatus(responsePromise, expected, label) {
  const response = await responsePromise;
  const text = await response.text();
  assert.equal(
    response.status,
    expected,
    `${label} should return ${expected}; got ${response.status}; body=${text}`
  );
  return { response, text };
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

function jobSeed({ company, companyUser, suffix, title, countryId, isExternal = false, isCampus = true }) {
  return {
    job_name: `${title} ${suffix}`,
    ref: `CAMP-${title.replace(/[^A-Za-z0-9]+/g, "-").slice(0, 24)}-${suffix.slice(-10)}`,
    description:
      "This seeded campus opportunity has enough detail to exercise mobile campus workflow side effects and authorization.",
    status: true,
    is_accepted: true,
    publish_status: "published",
    started_date: new Date(Date.now() - 24 * 60 * 60 * 1000),
    end_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    apply_deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    countries: [String(countryId)],
    city: "Campus",
    work_mode_id: objectId(),
    work_mode_info: { key: "hybrid", title_en: "Hybrid" },
    job_type_id: objectId(),
    job_type_info: { title_en: "Internship" },
    job_time_id: objectId(),
    job_time_info: { title_en: "Part time" },
    job_salary_id: objectId(),
    job_salary_info: { title_en: "Monthly" },
    salary: {
      currency_id: objectId(),
      currency_code: "USD",
      currency_rate_snapshot: 1,
      min: 900,
      max: 1600,
    },
    company_id: company._id,
    user_id: companyUser._id,
    candidate_target: isCampus ? ["students"] : ["experienced"],
    is_for_students: isCampus,
    skills_required: [{ title: "Communication", level: 3 }],
    languages: [{ name: "English", level: 5, level_text: "fluent" }],
    is_cv_required: true,
    is_out_side: isExternal,
    out_link: isExternal ? "https://example.com/campus-apply" : "",
  };
}

async function main() {
  mongo = await MongoMemoryServer.create({
    instance: {
      dbName: `halajob-campus-workflow-${nowToken()}`,
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
    CampusEventRegistrationModel,
    CompanyModel,
    EmployeeModel,
    RoleModel,
    StudentVerificationModel,
    UniversityMembershipModel,
    UniversityModel,
    UniversityOpportunityRequestModel,
    UserApplyingJobModel,
    UserModel,
    UserOutSideApplyingJobModel,
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
      name: `campus-employee-${suffix}`,
      role_number: 990001,
      title_ar: "Employee",
      title_en: "Employee",
      status: true,
      is_system: true,
    },
    {
      log_to: "company",
      name: `campus-company-${suffix}`,
      role_number: 990002,
      title_ar: "Company",
      title_en: "Company",
      status: true,
      is_system: true,
    },
  ]);

  const [studentUser, nonStudentUser, universityUserA, universityUserB, companyUser] = await UserModel.create([
    userSeed({
      firstName: "Campus",
      lastName: "Student",
      email: `campus.student.${suffix}@alpha.edu`,
      roleId: employeeRole._id,
      phone: `${phoneSeed}01`,
    }),
    userSeed({
      firstName: "Campus",
      lastName: "NonStudent",
      email: `campus.nonstudent.${suffix}@example.com`,
      roleId: employeeRole._id,
      phone: `${phoneSeed}02`,
    }),
    userSeed({
      firstName: "Alpha",
      lastName: "University",
      email: `career.${suffix}@alpha.edu`,
      roleId: employeeRole._id,
      phone: `${phoneSeed}03`,
    }),
    userSeed({
      firstName: "Beta",
      lastName: "University",
      email: `career.${suffix}@beta.edu`,
      roleId: employeeRole._id,
      phone: `${phoneSeed}04`,
    }),
    userSeed({
      firstName: "Campus",
      lastName: "Employer",
      email: `campus.company.${suffix}@example.com`,
      roleId: companyRole._id,
      phone: `${phoneSeed}05`,
    }),
  ]);

  const company = await CompanyModel.create({
    company_name: `Campus Employer ${suffix}`,
    company_email: `campus.${suffix}@company.example.com`,
    owner_user_id: companyUser._id,
    role_id: companyRole._id,
    status: true,
    accepted: true,
    can_upload: true,
    is_verified: true,
    profile_completion: 90,
  });

  const [universityA, universityB] = await UniversityModel.create([
    {
      name: `Alpha Campus University ${suffix}`,
      name_en: `Alpha Campus University ${suffix}`,
      email_domain: "alpha.edu",
      career_center_email: universityUserA.email,
      verified: true,
      status: "active",
      city: "Alpha City",
      country: "United States",
      campuses: [{ name: "Main Campus", city: "Alpha City", status: "active" }],
    },
    {
      name: `Beta Campus University ${suffix}`,
      name_en: `Beta Campus University ${suffix}`,
      email_domain: "beta.edu",
      career_center_email: universityUserB.email,
      verified: true,
      status: "active",
      city: "Beta City",
      country: "United States",
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

  const [studentEmployee, nonStudentEmployee] = await EmployeeModel.create([
    {
      user_id: studentUser._id,
      role_id: employeeRole._id,
      status: true,
      accepted: true,
      is_student: true,
      candidate_stage: "student",
      profile_headline: "Campus student",
      current_job_title: "Student ambassador",
      about_me: "I am ready for campus opportunities and internships.",
      profile_completion: 86,
      graduation_year: 2028,
      preferred_countries: [countryId],
      preferred_work_modes: [objectId()],
      job_names: [objectId()],
      job_types: [objectId()],
      skills: [{ title: "Communication", level: 4, years: 1 }],
      languages: [{ level: 5 }],
      education: [{ level: "Bachelor", study: "Business", institution: universityA.name }],
      cvs: [
        {
          title: "Campus CV",
          fileName: "campus-cv.pdf",
          url: "/uploads/test/campus-cv.pdf",
          status: "active",
        },
      ],
      student_profile: {
        university: universityA.name,
        university_id: universityA._id,
        specialty: "Business",
        academic_year: "third",
        enrollment_status: "student",
        student_email: studentUser.email,
        student_email_verified: false,
        readiness_score: 78,
        mini_cv_ready: true,
      },
    },
    {
      user_id: nonStudentUser._id,
      role_id: employeeRole._id,
      status: true,
      accepted: true,
      is_student: false,
      candidate_stage: "experienced",
      profile_headline: "Experienced candidate",
      current_job_title: "Operations associate",
    },
  ]);

  const [studentContext, nonStudentContext, universityContextA, universityContextB] = await AccountContextModel.create([
    {
      user_id: studentUser._id,
      context_key: `student:${studentEmployee._id}`,
      context_type: "student",
      entity_id: studentEmployee._id,
      entity_model: "employees",
      display_name: "Campus student",
      status: "active",
      permissions: ["campus.profile.manage", "campus.opportunities.apply", "campus.events.register"],
      is_default: true,
    },
    {
      user_id: nonStudentUser._id,
      context_key: `job_seeker:${nonStudentEmployee._id}`,
      context_type: "job_seeker",
      entity_id: nonStudentEmployee._id,
      entity_model: "employees",
      display_name: "Non-student seeker",
      status: "active",
      permissions: ["jobs.search", "jobs.apply"],
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
  ]);

  await Promise.all([
    UserModel.updateOne({ _id: studentUser._id }, { $set: { default_context_id: studentContext._id } }),
    UserModel.updateOne({ _id: nonStudentUser._id }, { $set: { default_context_id: nonStudentContext._id } }),
    UserModel.updateOne({ _id: universityUserA._id }, { $set: { default_context_id: universityContextA._id } }),
    UserModel.updateOne({ _id: universityUserB._id }, { $set: { default_context_id: universityContextB._id } }),
  ]);

  const [campusJob, campusExternalJob, nonCampusJob] = await jobsModel.create([
    jobSeed({ company, companyUser, suffix, title: "Campus Direct Opportunity", countryId }),
    jobSeed({ company, companyUser, suffix, title: "Campus External Opportunity", countryId, isExternal: true }),
    jobSeed({ company, companyUser, suffix, title: "Regular Non Campus Job", countryId, isCampus: false }),
  ]);

  const device = { brand: "CampusWorkflow", model_name: "Integration", is_device: false };
  const [studentTokens, nonStudentTokens, universityTokensA, universityTokensB] = await Promise.all([
    generateAuthTokens(studentUser, device),
    generateAuthTokens(nonStudentUser, device),
    generateAuthTokens(universityUserA, device),
    generateAuthTokens(universityUserB, device),
  ]);

  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  await expectStatus(
    request(baseUrl, "GET", "/user/v1/campus/dashboard", {
      token: nonStudentTokens.accessToken,
      contextId: nonStudentContext._id,
    }),
    403,
    "non-student employee context should not access campus dashboard"
  );

  const dashboard = await expectStatus(
    request(baseUrl, "GET", "/user/v1/campus/dashboard", {
      token: studentTokens.accessToken,
      contextId: studentContext._id,
    }),
    200,
    "student context should access campus dashboard"
  );
  assert.equal(dashboard.data.account.type, "campus");

  const eventId = `career-fair-${suffix}`;
  const firstRegister = await expectStatus(
    request(baseUrl, "POST", `/user/v1/campus/events/${eventId}/register`, {
      token: studentTokens.accessToken,
      contextId: studentContext._id,
      body: {
        title: "Career Fair",
        organizer: "Career Center",
        kind: "fair",
        date_label: "Tomorrow",
        start_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        mode: "onsite",
      },
    }),
    201,
    "student should register for a campus event"
  );

  await expectStatus(
    request(baseUrl, "POST", `/user/v1/campus/events/${eventId}/register`, {
      token: studentTokens.accessToken,
      contextId: studentContext._id,
      body: { title: "Career Fair" },
    }),
    200,
    "repeated event registration should be idempotent"
  );

  assert.equal(
    await CampusEventRegistrationModel.countDocuments({ user_id: studentUser._id, event_id: eventId }),
    1,
    "event registration should not duplicate"
  );
  assert.equal(
    await AnalyticsEventModel.countDocuments({ event: "event_joined", entity_id: firstRegister.data._id }),
    1,
    "event registration analytics should only be recorded once"
  );
  assert.ok(
    await AuditLogModel.findOne({ action: "campus_event_registered", entity_id: firstRegister.data._id }).lean(),
    "event registration should be audited"
  );

  await expectStatus(
    request(baseUrl, "PATCH", `/user/v1/campus/events/${eventId}/cancel`, {
      token: studentTokens.accessToken,
      contextId: studentContext._id,
    }),
    200,
    "student should cancel own event registration"
  );
  await expectStatus(
    request(baseUrl, "PATCH", `/user/v1/campus/events/${eventId}/cancel`, {
      token: studentTokens.accessToken,
      contextId: studentContext._id,
    }),
    200,
    "repeated event cancellation should be idempotent"
  );
  assert.equal(
    await AuditLogModel.countDocuments({ action: "campus_event_cancelled", entity_id: firstRegister.data._id }),
    1,
    "event cancellation should only be audited once"
  );

  await expectStatus(
    request(baseUrl, "POST", `/user/v1/campus/opportunities/${campusJob._id}/save`, {
      token: studentTokens.accessToken,
      contextId: studentContext._id,
    }),
    201,
    "student should save a campus opportunity"
  );
  await expectStatus(
    request(baseUrl, "POST", `/user/v1/campus/opportunities/${campusJob._id}/save`, {
      token: studentTokens.accessToken,
      contextId: studentContext._id,
    }),
    201,
    "repeated campus save should remain idempotent"
  );
  let campusJobAfterSave = await jobsModel.findById(campusJob._id).lean();
  assert.equal(await UserSavedJobModel.countDocuments({ user_id: studentUser._id, job_id: campusJob._id }), 1);
  assert.equal(campusJobAfterSave.user_saved, 1, "campus save counter should increment once");
  assert.equal(campusJobAfterSave.search_index.score_signals.saves, 1, "campus save signal should increment once");

  await UserSavedJobModel.create({ user_id: studentUser._id, job_id: nonCampusJob._id });
  await expectStatus(
    request(baseUrl, "DELETE", `/user/v1/campus/opportunities/${nonCampusJob._id}/save`, {
      token: studentTokens.accessToken,
      contextId: studentContext._id,
    }),
    404,
    "campus unsave should not mutate non-campus saved jobs"
  );
  assert.equal(
    await UserSavedJobModel.countDocuments({ user_id: studentUser._id, job_id: nonCampusJob._id }),
    1,
    "non-campus saved job should remain untouched"
  );

  await expectStatus(
    request(baseUrl, "DELETE", `/user/v1/campus/opportunities/${campusJob._id}/save`, {
      token: studentTokens.accessToken,
      contextId: studentContext._id,
    }),
    201,
    "student should unsave a campus opportunity"
  );
  campusJobAfterSave = await jobsModel.findById(campusJob._id).lean();
  assert.equal(campusJobAfterSave.user_saved, 0, "campus unsave counter should clamp to zero");
  assert.equal(campusJobAfterSave.search_index.score_signals.saves, 0, "campus unsave signal should clamp to zero");

  await expectStatus(
    request(baseUrl, "POST", `/user/v1/campus/opportunities/${campusJob._id}/apply`, {
      token: studentTokens.accessToken,
      contextId: studentContext._id,
      body: { cover_letter: "I would like to apply for this campus opportunity." },
    }),
    201,
    "student should apply to direct campus opportunity"
  );
  await expectStatus(
    request(baseUrl, "POST", `/user/v1/campus/opportunities/${campusJob._id}/apply`, {
      token: studentTokens.accessToken,
      contextId: studentContext._id,
      body: {},
    }),
    409,
    "duplicate direct campus apply should be blocked"
  );
  const campusApplication = await UserApplyingJobModel.findOne({ user_id: studentUser._id, job_id: campusJob._id }).lean();
  assert.ok(campusApplication, "direct campus application should persist");
  assert.ok(
    await ApplicationStatusHistoryModel.findOne({ application_id: campusApplication._id }).lean(),
    "direct campus application should create status history"
  );

  await expectStatus(
    request(baseUrl, "POST", `/user/v1/campus/opportunities/${campusExternalJob._id}/apply-external`, {
      token: studentTokens.accessToken,
      contextId: studentContext._id,
    }),
    201,
    "student should record external campus application"
  );
  await expectStatus(
    request(baseUrl, "POST", `/user/v1/campus/opportunities/${campusExternalJob._id}/apply-external`, {
      token: studentTokens.accessToken,
      contextId: studentContext._id,
    }),
    409,
    "duplicate external campus application should be blocked"
  );
  const campusExternalAfterApply = await jobsModel.findById(campusExternalJob._id).lean();
  assert.equal(await UserOutSideApplyingJobModel.countDocuments({ user_id: studentUser._id, job_id: campusExternalJob._id }), 1);
  assert.equal(campusExternalAfterApply.out_side_applying, 1, "campus external apply counter should increment once");
  assert.equal(
    campusExternalAfterApply.search_index.score_signals.applies,
    1,
    "campus external apply signal should increment once"
  );
  assert.ok(
    await AnalyticsEventModel.findOne({ event: "job_applied", job_id: campusExternalJob._id }).lean(),
    "campus external apply should record analytics"
  );

  const verificationStart = await expectStatus(
    request(baseUrl, "POST", "/user/v1/campus/student-verifications", {
      token: studentTokens.accessToken,
      contextId: studentContext._id,
      body: {
        university_id: universityA._id,
        method: "manual",
        student_email: studentUser.email,
        faculty_major: "Business",
        degree_level: "bachelor",
        academic_year: "third",
        graduation_year: 2028,
        source: "integration",
      },
    }),
    202,
    "student should start campus verification"
  );
  const verificationId = verificationStart.data.verification._id;
  assert.ok(
    await AuditLogModel.findOne({ action: "campus_verification_started", entity_id: verificationId }).lean(),
    "verification start should be audited"
  );
  assert.ok(
    await AnalyticsEventModel.findOne({ event: "campus_verification_started", entity_id: verificationId }).lean(),
    "verification start should record analytics"
  );

  await expectStatus(
    request(baseUrl, "POST", `/user/v1/campus/admin/verifications/${verificationId}/approve`, {
      token: universityTokensB.accessToken,
      contextId: universityContextB._id,
    }),
    404,
    "other university admin should not approve this verification"
  );

  await expectStatus(
    request(baseUrl, "POST", `/user/v1/campus/admin/verifications/${verificationId}/request-info`, {
      token: universityTokensA.accessToken,
      contextId: universityContextA._id,
      body: { requested_information: "Please confirm your graduation date." },
    }),
    200,
    "own university admin should request more information"
  );
  assert.equal((await StudentVerificationModel.findById(verificationId).lean()).status, "needs_more_information");
  assert.ok(
    await AuditLogModel.findOne({ action: "campus_verification_more_information_requested", entity_id: verificationId }).lean(),
    "request-info should be audited"
  );

  await expectStatus(
    request(baseUrl, "POST", `/user/v1/campus/student-verifications/${verificationId}/resubmit`, {
      token: studentTokens.accessToken,
      contextId: studentContext._id,
      body: { note: "Graduation year confirmed." },
    }),
    200,
    "student should resubmit verification"
  );
  assert.equal((await StudentVerificationModel.findById(verificationId).lean()).status, "pending");
  assert.ok(
    await AuditLogModel.findOne({ action: "campus_verification_resubmitted", entity_id: verificationId }).lean(),
    "resubmit should be audited"
  );

  await expectStatus(
    request(baseUrl, "POST", `/user/v1/campus/admin/verifications/${verificationId}/approve`, {
      token: universityTokensA.accessToken,
      contextId: universityContextA._id,
    }),
    200,
    "own university admin should approve verification"
  );
  const [approvedVerification, updatedStudent] = await Promise.all([
    StudentVerificationModel.findById(verificationId).lean(),
    EmployeeModel.findById(studentEmployee._id).lean(),
  ]);
  assert.equal(approvedVerification.status, "verified");
  assert.equal(updatedStudent.student_profile.student_email_verified, true, "approval should mark student email verified");
  assert.equal(String(updatedStudent.student_profile.university_id), String(universityA._id));
  assert.ok(
    await AuditLogModel.findOne({ action: "campus_verification_approved", entity_id: verificationId }).lean(),
    "approval should be audited"
  );
  assert.ok(
    await AnalyticsEventModel.findOne({ event: "campus_verification_approved", entity_id: verificationId }).lean(),
    "approval should record analytics"
  );

  const universityOverview = await expectStatus(
    request(baseUrl, "GET", "/university/v1/dashboard", {
      token: universityTokensA.accessToken,
      contextId: universityContextA._id,
    }),
    200,
    "university dashboard should load for university admin"
  );
  assert.equal(universityOverview.data.stats.verified_students, 1);

  const opportunityRequest = await expectStatus(
    request(baseUrl, "POST", "/university/v1/opportunities", {
      token: universityTokensA.accessToken,
      contextId: universityContextA._id,
      body: {
        title: "Request internship partners",
        description: "Need partner employers for business internships.",
        target: "students",
        requested_count: 30,
      },
    }),
    202,
    "university admin should create opportunity request"
  );
  assert.equal(await UniversityOpportunityRequestModel.countDocuments({ university_id: universityA._id }), 1);
  assert.ok(
    await AuditLogModel.findOne({
      action: "university_opportunity_request_created",
      entity_id: opportunityRequest.data._id,
    }).lean(),
    "university opportunity request should be audited"
  );

  const { response: csvResponse, text: csvText } = await expectRawStatus(
    request(baseUrl, "GET", "/university/v1/reports/outcomes?format=csv", {
      token: universityTokensA.accessToken,
      contextId: universityContextA._id,
    }),
    200,
    "university outcome CSV report should export"
  );
  assert.match(csvResponse.headers.get("content-type") || "", /text\/csv/i);
  assert.match(csvResponse.headers.get("content-disposition") || "", /attachment/i);
  assert.match(csvText, /registered_students/);

  console.log(
    "Campus workflow integration verified for student-only campus access, event lifecycle, opportunity save/apply, verification review, university requests, reports, counters, audit logs, and analytics."
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
