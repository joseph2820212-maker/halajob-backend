import assert from "node:assert/strict";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET ||= "hiring-workflow-integration-secret";
process.env.ACCESS_TOKEN_EXPIRATION_MINUTES ||= "30";
process.env.REFRESH_TOKEN_EXPIRATION_DAYS ||= "30";
process.env.HEALTH_SECRET ||= "hiring-workflow-health-secret";

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

function jobSeed({ company, companyUser, countryId, suffix, title }) {
  return {
    job_name: `${title} ${suffix}`,
    ref: `HIR-${title.replace(/[^A-Za-z0-9]+/g, "-").slice(0, 18)}-${suffix.slice(-10)}`,
    description:
      "This seeded hiring workflow job is long enough to exercise ATS, interview, and invitation side effects safely.",
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
      min: 1800,
      max: 2800,
    },
    company_id: company._id,
    user_id: companyUser._id,
    skills_required: [{ title: "Customer success", level: 3 }],
    languages: [{ name: "English", level: 5, level_text: "fluent" }],
    is_cv_required: true,
  };
}

async function main() {
  mongo = await MongoMemoryServer.create({
    instance: {
      dbName: `halajob-hiring-workflow-${nowToken()}`,
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
    CompanySubscriptionModel,
    EmployeeModel,
    InterviewModel,
    JobInvitationModel,
    RoleModel,
    UserApplyingJobModel,
    UserModel,
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
      name: `hiring-workflow-employee-${suffix}`,
      role_number: 990001,
      title_ar: "Employee",
      title_en: "Employee",
      status: true,
      is_system: true,
    },
    {
      log_to: "company",
      name: `hiring-workflow-company-${suffix}`,
      role_number: 990002,
      title_ar: "Company",
      title_en: "Company",
      status: true,
      is_system: true,
    },
  ]);

  const [companyUserA, companyUserB, applicantUser, invitedUser, cancelInviteUser] = await UserModel.create([
    userSeed({
      firstName: "Hiring",
      lastName: "CompanyA",
      email: `hiring.company.a.${suffix}@example.com`,
      roleId: companyRole._id,
      phone: `${phoneSeed}01`,
    }),
    userSeed({
      firstName: "Hiring",
      lastName: "CompanyB",
      email: `hiring.company.b.${suffix}@example.com`,
      roleId: companyRole._id,
      phone: `${phoneSeed}02`,
    }),
    userSeed({
      firstName: "Hiring",
      lastName: "Applicant",
      email: `hiring.applicant.${suffix}@example.com`,
      roleId: employeeRole._id,
      phone: `${phoneSeed}03`,
    }),
    userSeed({
      firstName: "Hiring",
      lastName: "Invitee",
      email: `hiring.invitee.${suffix}@example.com`,
      roleId: employeeRole._id,
      phone: `${phoneSeed}04`,
    }),
    userSeed({
      firstName: "Hiring",
      lastName: "CancelInvitee",
      email: `hiring.cancel.invitee.${suffix}@example.com`,
      roleId: employeeRole._id,
      phone: `${phoneSeed}05`,
    }),
  ]);

  const [companyA, companyB] = await CompanyModel.create([
    {
      company_name: `Hiring Alpha ${suffix}`,
      company_email: `hiring-alpha-${suffix}@company.example.com`,
      owner_user_id: companyUserA._id,
      role_id: companyRole._id,
      status: true,
      accepted: true,
      can_upload: true,
      is_verified: true,
      profile_completion: 90,
    },
    {
      company_name: `Hiring Beta ${suffix}`,
      company_email: `hiring-beta-${suffix}@company.example.com`,
      owner_user_id: companyUserB._id,
      role_id: companyRole._id,
      status: true,
      accepted: true,
      can_upload: true,
      is_verified: true,
      profile_completion: 90,
    },
  ]);

  const [applicantEmployee, invitedEmployee, cancelInviteEmployee] = await EmployeeModel.create([
    {
      user_id: applicantUser._id,
      role_id: employeeRole._id,
      status: true,
      accepted: true,
      profile_headline: "Applicant for interview workflow",
      cvs: [{ url: "uploads/files/applicant-cv.pdf", fileName: "applicant-cv.pdf", status: "active" }],
    },
    {
      user_id: invitedUser._id,
      role_id: employeeRole._id,
      status: true,
      accepted: true,
      profile_headline: "Invitee for offer workflow",
      cvs: [{ url: "uploads/files/invitee-cv.pdf", fileName: "invitee-cv.pdf", status: "active" }],
    },
    {
      user_id: cancelInviteUser._id,
      role_id: employeeRole._id,
      status: true,
      accepted: true,
      profile_headline: "Invitee for cancellation workflow",
      cvs: [{ url: "uploads/files/cancel-invitee-cv.pdf", fileName: "cancel-invitee-cv.pdf", status: "active" }],
    },
  ]);

  const [contextCompanyA, contextCompanyB, contextApplicant, contextInvited, contextCancelInvite] =
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
        user_id: applicantUser._id,
        context_key: `job_seeker:${applicantEmployee._id}`,
        context_type: "job_seeker",
        entity_id: applicantEmployee._id,
        entity_model: "employees",
        display_name: "Hiring applicant",
        status: "active",
        permissions: ["employee"],
        is_default: true,
      },
      {
        user_id: invitedUser._id,
        context_key: `job_seeker:${invitedEmployee._id}`,
        context_type: "job_seeker",
        entity_id: invitedEmployee._id,
        entity_model: "employees",
        display_name: "Hiring invitee",
        status: "active",
        permissions: ["employee"],
        is_default: true,
      },
      {
        user_id: cancelInviteUser._id,
        context_key: `job_seeker:${cancelInviteEmployee._id}`,
        context_type: "job_seeker",
        entity_id: cancelInviteEmployee._id,
        entity_model: "employees",
        display_name: "Hiring cancel invitee",
        status: "active",
        permissions: ["employee"],
        is_default: true,
      },
    ]);

  await Promise.all([
    UserModel.updateOne({ _id: companyUserA._id }, { $set: { default_context_id: contextCompanyA._id } }),
    UserModel.updateOne({ _id: companyUserB._id }, { $set: { default_context_id: contextCompanyB._id } }),
    UserModel.updateOne({ _id: applicantUser._id }, { $set: { default_context_id: contextApplicant._id } }),
    UserModel.updateOne({ _id: invitedUser._id }, { $set: { default_context_id: contextInvited._id } }),
    UserModel.updateOne({ _id: cancelInviteUser._id }, { $set: { default_context_id: contextCancelInvite._id } }),
  ]);

  const [jobA, jobB] = await jobsModel.create([
    jobSeed({ company: companyA, companyUser: companyUserA, countryId, suffix, title: "Hiring Workflow" }),
    jobSeed({ company: companyB, companyUser: companyUserB, countryId, suffix, title: "Hiring Other Company" }),
  ]);

  const application = await UserApplyingJobModel.create({
    user_id: applicantUser._id,
    employee_id: applicantEmployee._id,
    job_id: jobA._id,
    company_id: companyA._id,
    first_name: "Hiring",
    last_name: "Applicant",
    email: applicantUser.email,
    phone_code: "+1",
    phone_national: `555${phoneSeed}99`,
    country_id: countryId,
    answers: [],
    cv: "uploads/files/applicant-cv.pdf",
    cover_letter: "Seeded application for interview workflow.",
    source: "app",
    status: "new",
    last_activity_at: new Date(),
  });

  const device = { brand: "Hiring Workflow", model_name: "Integration", is_device: false };
  const [companyATokens, companyBTokens, applicantTokens, invitedTokens, cancelInviteTokens] = await Promise.all([
    generateAuthTokens(companyUserA, device),
    generateAuthTokens(companyUserB, device),
    generateAuthTokens(applicantUser, device),
    generateAuthTokens(invitedUser, device),
    generateAuthTokens(cancelInviteUser, device),
  ]);

  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  const startAt = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
  const interviewResponse = await expectStatus(
    request(baseUrl, "POST", `/company/v1/jobs/hiring/applications/${application._id}/interviews`, {
      token: companyATokens.accessToken,
      contextId: contextCompanyA._id,
      body: {
        start_at: startAt,
        type: "online",
        meet_link: "https://meet.example.com/hiring-workflow",
        company_note: "Initial interview",
      },
    }),
    201,
    "company should create interview"
  );
  const interviewId = interviewResponse.data?._id;
  assert.ok(mongoose.Types.ObjectId.isValid(String(interviewId)), "created interview id should be returned");

  await expectStatus(
    request(baseUrl, "PATCH", `/company/v1/jobs/hiring/interviews/${interviewId}`, {
      token: companyBTokens.accessToken,
      contextId: contextCompanyB._id,
      body: { start_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() },
    }),
    404,
    "other company should not reschedule interview"
  );

  const rescheduledAt = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString();
  await expectStatus(
    request(baseUrl, "PATCH", `/company/v1/jobs/hiring/interviews/${interviewId}`, {
      token: companyATokens.accessToken,
      contextId: contextCompanyA._id,
      body: {
        start_at: rescheduledAt,
        end_at: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
        company_note: "Rescheduled once",
      },
    }),
    200,
    "owning company should reschedule interview"
  );

  await expectStatus(
    request(baseUrl, "PATCH", `/employee/v1/global/applications/interviews/${interviewId}/respond`, {
      token: invitedTokens.accessToken,
      contextId: contextInvited._id,
      body: { status: "accepted" },
    }),
    404,
    "other employee should not respond to applicant interview"
  );

  await expectStatus(
    request(baseUrl, "PATCH", `/employee/v1/global/applications/interviews/${interviewId}/respond`, {
      token: applicantTokens.accessToken,
      contextId: contextApplicant._id,
      body: { status: "accepted", note: "I will attend" },
    }),
    200,
    "candidate should accept own interview"
  );

  await expectStatus(
    request(baseUrl, "PATCH", `/company/v1/jobs/hiring/interviews/${interviewId}/status`, {
      token: companyATokens.accessToken,
      contextId: contextCompanyA._id,
      body: {
        status: "completed",
        result_note: "Strong interview",
        rating: 5,
        scorecard: JSON.stringify({
          technical: 85,
          communication: 90,
          culture_fit: 88,
          overall: 89,
          recommendation: "hire",
          notes: "Good fit",
        }),
      },
    }),
    200,
    "company should complete interview with scorecard"
  );

  const refreshedInterview = await InterviewModel.findById(interviewId).lean();
  assert.equal(refreshedInterview.status, "completed", "interview status should be completed");
  assert.equal(refreshedInterview.scorecard.overall, 89, "scorecard JSON should be parsed and saved");
  assert.equal(refreshedInterview.reschedule_count, 1, "reschedule count should increment once");

  const refreshedApplication = await UserApplyingJobModel.findById(application._id).lean();
  assert.equal(refreshedApplication.status, "interview_completed", "application should follow completed interview status");

  const firstInvitation = await expectStatus(
    request(baseUrl, "POST", `/company/v1/jobs/hiring/${jobA._id}/invitations`, {
      token: companyATokens.accessToken,
      contextId: contextCompanyA._id,
      body: {
        employee_id: invitedEmployee._id,
        message: "Please apply for this role.",
      },
    }),
    201,
    "company should send job invitation"
  );
  const invitationId = firstInvitation.data?._id;
  assert.ok(mongoose.Types.ObjectId.isValid(String(invitationId)), "invitation id should be returned");

  await expectStatus(
    request(baseUrl, "POST", `/company/v1/jobs/hiring/${jobA._id}/invitations`, {
      token: companyATokens.accessToken,
      contextId: contextCompanyA._id,
      body: {
        employee_id: invitedEmployee._id,
        message: "Updated invitation message.",
      },
    }),
    201,
    "repeat invitation should update existing invitation"
  );

  await expectStatus(
    request(baseUrl, "GET", `/employee/v1/global/applications/offers/${invitationId}`, {
      token: invitedTokens.accessToken,
      contextId: contextInvited._id,
    }),
    200,
    "candidate should view own invitation"
  );

  const acceptedInvitation = await expectStatus(
    request(baseUrl, "PATCH", `/employee/v1/global/applications/offers/${invitationId}/respond`, {
      token: invitedTokens.accessToken,
      contextId: contextInvited._id,
      body: { status: "accepted", note: "Accepted offer invitation" },
    }),
    200,
    "candidate should accept job invitation"
  );

  const createdFromInvitation = await UserApplyingJobModel.findOne({
    user_id: invitedUser._id,
    job_id: jobA._id,
    source: "invitation",
  }).lean();
  assert.ok(
    createdFromInvitation,
    `accepting invitation should create a job application; response=${JSON.stringify(acceptedInvitation)}`
  );

  const cancelledInvitation = await expectStatus(
    request(baseUrl, "POST", `/company/v1/jobs/hiring/${jobA._id}/invitations`, {
      token: companyATokens.accessToken,
      contextId: contextCompanyA._id,
      body: {
        employee_id: cancelInviteEmployee._id,
        message: "Temporary invite.",
      },
    }),
    201,
    "company should send second invitation"
  );
  const cancelledInvitationId = cancelledInvitation.data?._id;

  await expectStatus(
    request(baseUrl, "PATCH", `/company/v1/jobs/hiring/invitations/${cancelledInvitationId}/cancel`, {
      token: companyATokens.accessToken,
      contextId: contextCompanyA._id,
      body: { reason: "Position filled" },
    }),
    200,
    "company should cancel pending invitation"
  );

  await expectStatus(
    request(baseUrl, "PATCH", `/employee/v1/global/applications/offers/${cancelledInvitationId}/respond`, {
      token: cancelInviteTokens.accessToken,
      contextId: contextCancelInvite._id,
      body: { status: "accepted" },
    }),
    422,
    "candidate should not accept cancelled invitation"
  );

  const subscription = await CompanySubscriptionModel.findOne({ company_id: companyA._id }).lean();
  assert.equal(subscription.usage.interviews, 1, "interview usage should increment once");
  assert.equal(subscription.usage.invitations, 2, "repeat pending invitation should not double-count usage");

  assert.equal(
    await JobInvitationModel.countDocuments({ job_id: jobA._id, employee_id: invitedEmployee._id }),
    1,
    "repeat invite should keep one invitation row"
  );
  assert.equal(
    await JobInvitationModel.countDocuments({ job_id: jobB._id }),
    0,
    "unrelated company job should remain untouched"
  );

  const historyActions = await ApplicationStatusHistoryModel.distinct("action", {
    application_id: { $in: [application._id, createdFromInvitation._id] },
  });
  assert.ok(historyActions.includes("interview_scheduled"), "history should include interview_scheduled");
  assert.ok(historyActions.includes("interview_rescheduled"), "history should include interview_rescheduled");
  assert.ok(historyActions.includes("interview_accepted_by_candidate"), "history should include candidate interview response");
  assert.ok(historyActions.includes("interview_completed"), "history should include interview_completed");

  for (const action of [
    "interview_scheduled",
    "interview_rescheduled",
    "interview_accepted_by_candidate",
    "interview_completed",
    "job_invitation_sent",
    "job_invitation_updated",
    "job_invitation_accepted_by_candidate",
    "application_created_from_job_invitation",
    "job_invitation_cancelled",
  ]) {
    assert.ok(
      await AuditLogModel.exists({ company_id: companyA._id, action }),
      `audit log should include ${action}`
    );
  }

  for (const event of [
    "interview_scheduled",
    "interview_updated",
    "interview_response_saved",
    "interview_status_changed",
    "job_invitation_sent",
    "job_invitation_response_saved",
    "job_invitation_cancelled",
    "job_applied",
  ]) {
    assert.ok(
      await waitFor(
        () => AnalyticsEventModel.exists({ company_id: companyA._id, event }),
        `analytics event ${event}`
      )
    );
  }

  console.log("Hiring workflow integration verified for ATS interviews, candidate responses, invitations, usage, audit logs, and analytics.");
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
