import assert from "node:assert/strict";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET ||= "interview-scheduling-integration-secret";
process.env.ACCESS_TOKEN_EXPIRATION_MINUTES ||= "30";
process.env.REFRESH_TOKEN_EXPIRATION_DAYS ||= "30";
process.env.HEALTH_SECRET ||= "interview-scheduling-health-secret";

let mongo;
let server;

const nowToken = () => new Date().toISOString().replace(/[-:.TZ]/g, "");
const objectId = () => new mongoose.Types.ObjectId();

function authHeaders(token, contextId) {
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...(contextId ? { "X-Active-Context-Id": String(contextId) } : {}),
  };
}

async function request(baseUrl, method, pathName, { token, contextId, body } = {}) {
  return fetch(`${baseUrl}${pathName}`, {
    method,
    headers: token ? authHeaders(token, contextId) : { Accept: "application/json", "Content-Type": "application/json" },
    ...(!["GET", "HEAD"].includes(method) ? { body: JSON.stringify(body || {}) } : {}),
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
  assert.equal(response.status, expected, `${label} expected ${expected}; got ${response.status}; body=${JSON.stringify(payload)}`);
  return payload;
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
    ref: `INT-${title.replace(/[^A-Za-z0-9]+/g, "-").slice(0, 18)}-${suffix.slice(-10)}`,
    description: "Interview scheduling integration job with enough text to pass validation and exercise hiring flows.",
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
    instance: { dbName: `halajob-interview-scheduling-${nowToken()}` },
  });
  process.env.CONNECTION_URL = mongo.getUri();

  const [{ default: app }, models, tokenService] = await Promise.all([
    import("../app.js"),
    import("../models/index.js"),
    import("../services/tokenService.js"),
  ]);

  const {
    AccountContextModel,
    CommunicationDeliveryLogModel,
    CompanyModel,
    EmployeeModel,
    InterviewModel,
    RoleModel,
    UserApplyingJobModel,
    UserModel,
    jobsModel,
  } = models;
  const { generateAuthTokens } = tokenService;

  await mongoose.connect(process.env.CONNECTION_URL, { serverSelectionTimeoutMS: 10000 });

  const suffix = nowToken();
  const phoneSeed = suffix.slice(-8);
  const countryId = objectId();

  const [employeeRole, companyRole] = await RoleModel.create([
    {
      log_to: "employee",
      name: `interview-scheduling-employee-${suffix}`,
      role_number: 991001,
      title_ar: "Employee",
      title_en: "Employee",
      status: true,
      is_system: true,
    },
    {
      log_to: "company",
      name: `interview-scheduling-company-${suffix}`,
      role_number: 991002,
      title_ar: "Company",
      title_en: "Company",
      status: true,
      is_system: true,
    },
  ]);

  const [companyUserA, companyUserB, applicantUser, otherApplicantUser] = await UserModel.create([
    userSeed({ firstName: "Interview", lastName: "CompanyA", email: `interview.company.a.${suffix}@example.com`, roleId: companyRole._id, phone: `${phoneSeed}01` }),
    userSeed({ firstName: "Interview", lastName: "CompanyB", email: `interview.company.b.${suffix}@example.com`, roleId: companyRole._id, phone: `${phoneSeed}02` }),
    userSeed({ firstName: "Interview", lastName: "Applicant", email: `interview.applicant.${suffix}@example.com`, roleId: employeeRole._id, phone: `${phoneSeed}03` }),
    userSeed({ firstName: "Interview", lastName: "OtherApplicant", email: `interview.other.${suffix}@example.com`, roleId: employeeRole._id, phone: `${phoneSeed}04` }),
  ]);

  const [companyA, companyB] = await CompanyModel.create([
    {
      company_name: `Interview Alpha ${suffix}`,
      company_email: `interview-alpha-${suffix}@company.example.com`,
      owner_user_id: companyUserA._id,
      role_id: companyRole._id,
      status: true,
      accepted: true,
      can_upload: true,
      is_verified: true,
      profile_completion: 90,
    },
    {
      company_name: `Interview Beta ${suffix}`,
      company_email: `interview-beta-${suffix}@company.example.com`,
      owner_user_id: companyUserB._id,
      role_id: companyRole._id,
      status: true,
      accepted: true,
      can_upload: true,
      is_verified: true,
      profile_completion: 90,
    },
  ]);

  const [applicantEmployee, otherApplicantEmployee] = await EmployeeModel.create([
    {
      user_id: applicantUser._id,
      role_id: employeeRole._id,
      status: true,
      accepted: true,
      profile_headline: "Applicant for interview scheduling",
      cvs: [{ url: "uploads/files/interview-applicant-cv.pdf", fileName: "interview-applicant-cv.pdf", status: "active" }],
    },
    {
      user_id: otherApplicantUser._id,
      role_id: employeeRole._id,
      status: true,
      accepted: true,
      profile_headline: "Other applicant for interview scheduling",
      cvs: [{ url: "uploads/files/interview-other-cv.pdf", fileName: "interview-other-cv.pdf", status: "active" }],
    },
  ]);

  const [contextCompanyA, contextCompanyB, contextApplicant, contextOtherApplicant] = await AccountContextModel.create([
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
      display_name: "Interview applicant",
      status: "active",
      permissions: ["employee"],
      is_default: true,
    },
    {
      user_id: otherApplicantUser._id,
      context_key: `job_seeker:${otherApplicantEmployee._id}`,
      context_type: "job_seeker",
      entity_id: otherApplicantEmployee._id,
      entity_model: "employees",
      display_name: "Interview other applicant",
      status: "active",
      permissions: ["employee"],
      is_default: true,
    },
  ]);

  await Promise.all([
    UserModel.updateOne({ _id: companyUserA._id }, { $set: { default_context_id: contextCompanyA._id } }),
    UserModel.updateOne({ _id: companyUserB._id }, { $set: { default_context_id: contextCompanyB._id } }),
    UserModel.updateOne({ _id: applicantUser._id }, { $set: { default_context_id: contextApplicant._id } }),
    UserModel.updateOne({ _id: otherApplicantUser._id }, { $set: { default_context_id: contextOtherApplicant._id } }),
  ]);

  const jobA = await jobsModel.create(jobSeed({ company: companyA, companyUser: companyUserA, countryId, suffix, title: "Interview Scheduling" }));

  const application = await UserApplyingJobModel.create({
    user_id: applicantUser._id,
    employee_id: applicantEmployee._id,
    job_id: jobA._id,
    company_id: companyA._id,
    first_name: "Interview",
    last_name: "Applicant",
    email: applicantUser.email,
    phone_code: "+1",
    phone_national: `555${phoneSeed}99`,
    country_id: countryId,
    answers: [],
    cv: "uploads/files/interview-applicant-cv.pdf",
    cover_letter: "Seeded application for interview scheduling workflow.",
    source: "app",
    status: "new",
    last_activity_at: new Date(),
  });

  const device = { brand: "Interview Scheduling", model_name: "Integration", is_device: false };
  const [companyATokens, companyBTokens, applicantTokens, otherApplicantTokens] = await Promise.all([
    generateAuthTokens(companyUserA, device),
    generateAuthTokens(companyUserB, device),
    generateAuthTokens(applicantUser, device),
    generateAuthTokens(otherApplicantUser, device),
  ]);

  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  const startAt = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
  const endAt = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000).toISOString();
  const createPayload = await expectStatus(
    request(baseUrl, "POST", "/company/v1/interviews", {
      token: companyATokens.accessToken,
      contextId: contextCompanyA._id,
      body: {
        application_id: application._id,
        start_at: startAt,
        end_at: endAt,
        type: "online",
        meeting_provider: "zoom",
        calendar_provider: "ical",
        calendar_event_id: `calendar-${suffix}`,
        meet_link: "https://zoom.us/j/interview-phase-9",
        meeting_join_instructions: "Join five minutes early.",
        company_note: "Initial live interview",
      },
    }),
    201,
    "company should create top-level interview"
  );

  const interviewId = createPayload.data?._id;
  assert.ok(mongoose.Types.ObjectId.isValid(String(interviewId)), "created interview id should be returned");
  assert.equal(createPayload.data?.meeting_provider, "zoom", "meeting provider should be returned");
  assert.equal(createPayload.data?.candidate_response?.status, "pending", "candidate response should start pending");

  await expectStatus(
    request(baseUrl, "POST", "/company/v1/interviews", {
      token: companyBTokens.accessToken,
      contextId: contextCompanyB._id,
      body: {
        application_id: application._id,
        start_at: startAt,
        end_at: endAt,
      },
    }),
    404,
    "other company cannot schedule interview for an application it does not own"
  );

  const companyDetail = await expectStatus(
    request(baseUrl, "GET", `/company/v1/interviews/${interviewId}`, {
      token: companyATokens.accessToken,
      contextId: contextCompanyA._id,
    }),
    200,
    "company should view owned interview detail"
  );
  assert.equal(companyDetail.data?.meet_link, "https://zoom.us/j/interview-phase-9", "company detail should include meeting link");

  const applicantDetail = await expectStatus(
    request(baseUrl, "GET", `/employee/v1/global/applications/interviews/${interviewId}`, {
      token: applicantTokens.accessToken,
      contextId: contextApplicant._id,
    }),
    200,
    "candidate should view own interview detail"
  );
  assert.equal(applicantDetail.data?.meet_link, "https://zoom.us/j/interview-phase-9", "candidate detail should include meeting link");

  await expectStatus(
    request(baseUrl, "GET", `/employee/v1/global/applications/interviews/${interviewId}`, {
      token: otherApplicantTokens.accessToken,
      contextId: contextOtherApplicant._id,
    }),
    404,
    "other candidate cannot view someone else's interview"
  );

  const accepted = await expectStatus(
    request(baseUrl, "PATCH", `/employee/v1/global/applications/interviews/${interviewId}/respond`, {
      token: applicantTokens.accessToken,
      contextId: contextApplicant._id,
      body: { status: "accepted", note: "Confirmed" },
    }),
    200,
    "candidate should accept interview"
  );
  assert.equal(accepted.data?.candidate_response?.status, "accepted", "accept should update structured candidate response");

  const rescheduleRequest = await expectStatus(
    request(baseUrl, "POST", `/employee/v1/global/applications/interviews/${interviewId}/reschedule-request`, {
      token: applicantTokens.accessToken,
      contextId: contextApplicant._id,
      body: { note: "Could we move this one hour later?" },
    }),
    200,
    "candidate should request reschedule"
  );
  assert.equal(rescheduleRequest.data?.candidate_response?.status, "reschedule_requested", "reschedule request should be tracked separately");

  const movedStart = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
  const movedEnd = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000).toISOString();
  const moved = await expectStatus(
    request(baseUrl, "PATCH", `/company/v1/interviews/${interviewId}`, {
      token: companyATokens.accessToken,
      contextId: contextCompanyA._id,
      body: { start_at: movedStart, end_at: movedEnd },
    }),
    200,
    "company should reschedule interview"
  );
  assert.equal(moved.data?.status, "rescheduled", "company reschedule should update status");
  assert.equal(moved.data?.candidate_response?.status, "pending", "company reschedule should reset candidate response");

  const reminder = await expectStatus(
    request(baseUrl, "POST", `/company/v1/interviews/${interviewId}/send-reminder`, {
      token: companyATokens.accessToken,
      contextId: contextCompanyA._id,
      body: { kind: "hour_before", channels: ["in_app"] },
    }),
    200,
    "company should send interview reminder"
  );
  assert.ok(reminder.data?.communication?.results?.length, "reminder should return communication results");
  const deliveryLog = await CommunicationDeliveryLogModel.findOne({
    user_id: applicantUser._id,
    event_key: "interview_reminder",
  }).lean();
  assert.ok(deliveryLog, "reminder should write communication delivery log");

  const feedback = await expectStatus(
    request(baseUrl, "POST", `/company/v1/interviews/${interviewId}/feedback`, {
      token: companyATokens.accessToken,
      contextId: contextCompanyA._id,
      body: {
        strengths: "Clear examples",
        concerns: "Needs deeper technical examples",
        next_step: "second_round",
        rating: 4,
        scorecard: { overall: 82, recommendation: "maybe" },
      },
    }),
    200,
    "company should submit interview feedback"
  );
  assert.equal(feedback.data?.feedback?.next_step, "second_round", "feedback next step should persist");
  assert.equal(feedback.data?.scorecard?.overall, 82, "scorecard should merge with feedback");

  const noShow = await expectStatus(
    request(baseUrl, "POST", `/company/v1/interviews/${interviewId}/mark-no-show`, {
      token: companyATokens.accessToken,
      contextId: contextCompanyA._id,
      body: { note: "Candidate did not join." },
    }),
    200,
    "company should mark no-show"
  );
  assert.equal(noShow.data?.status, "no_show", "no-show endpoint should update status");

  const stored = await InterviewModel.findById(interviewId).lean();
  assert.equal(stored.meeting_provider, "zoom", "meeting provider should be stored on InterviewModel");
  assert.equal(stored.calendar_provider, "ical", "calendar provider should be stored on InterviewModel");
  assert.ok(stored.reminders?.hour_before_sent_at, "hour-before reminder timestamp should be stored");
  assert.equal(stored.feedback?.next_step, "second_round", "feedback should be stored on InterviewModel");

  console.log("Live interview scheduling integration verified for route contract, ownership, candidate response, reminders, feedback, and no-show.");
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
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongo) {
      await mongo.stop();
    }
  });
