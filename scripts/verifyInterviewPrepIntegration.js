import assert from "node:assert/strict";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET ||= "interview-prep-integration-secret";
process.env.ACCESS_TOKEN_EXPIRATION_MINUTES ||= "30";
process.env.REFRESH_TOKEN_EXPIRATION_DAYS ||= "30";
process.env.HEALTH_SECRET ||= "interview-prep-health-secret";

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

function userSeed({ firstName, lastName, email, roleId, phone }) {
  return {
    first_name: firstName,
    last_name: lastName,
    email,
    gender: "female",
    role_id: roleId,
    password: "not-used",
    status: true,
    phone: `+1888${phone}`,
    phone_e164: `+1888${phone}`,
    phone_country: "US",
    phone_code: "+1",
    phone_national: `888${phone}`,
  };
}

async function main() {
  mongo = await MongoMemoryServer.create({
    instance: {
      dbName: `halajob-interview-prep-${nowToken()}`,
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
    EmployeeModel,
    InterviewPrepQuestionModel,
    LearningResourceModel,
    RoleModel,
    UserInterviewPrepProgressModel,
    UserModel,
    jobsModel,
  } = models;
  const { generateAuthTokens } = tokenService;

  await mongoose.connect(process.env.CONNECTION_URL, {
    serverSelectionTimeoutMS: 10000,
  });

  const suffix = nowToken().toLowerCase();
  const phoneSeed = suffix.slice(-8).replace(/\D/g, "").padEnd(8, "0");
  const jobNameId = new mongoose.Types.ObjectId();
  const companyId = new mongoose.Types.ObjectId();
  const lookupId = () => new mongoose.Types.ObjectId();

  const [employeeRole, dashRole] = await RoleModel.create([
    {
      log_to: "employee",
      name: `interview-prep-employee-${suffix}`,
      role_number: 994101,
      title_ar: "Employee",
      title_en: "Employee",
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

  const [studentUser, dashboardAdminUser, companyUser] = await UserModel.create([
    userSeed({
      firstName: "Interview",
      lastName: "Student",
      email: `interview.student.${suffix}@example.com`,
      roleId: employeeRole._id,
      phone: `${phoneSeed}01`,
    }),
    userSeed({
      firstName: "Interview",
      lastName: "Admin",
      email: `interview.admin.${suffix}@example.com`,
      roleId: dashRole._id,
      phone: `${phoneSeed}02`,
    }),
    userSeed({
      firstName: "Interview",
      lastName: "Company",
      email: `interview.company.${suffix}@example.com`,
      roleId: dashRole._id,
      phone: `${phoneSeed}03`,
    }),
  ]);

  const studentEmployee = await EmployeeModel.create({
    user_id: studentUser._id,
    role_id: employeeRole._id,
    status: true,
    accepted: true,
    is_student: false,
    candidate_stage: "experienced",
    profile_headline: "Backend developer",
    skills: [{ title: "python" }, { title: "api" }],
  });

  const studentContext = await AccountContextModel.create({
    user_id: studentUser._id,
    context_key: `job_seeker:${studentEmployee._id}`,
    context_type: "job_seeker",
    entity_id: studentEmployee._id,
    entity_model: "employees",
    display_name: "Interview Student",
    status: "active",
    permissions: ["profile.manage"],
    is_default: true,
  });

  await UserModel.updateOne(
    { _id: studentUser._id },
    { $set: { default_context_id: studentContext._id } },
  );

  const device = { brand: "Interview Prep", model_name: "Integration", is_device: false };
  const [studentTokens, dashboardAdminTokens] = await Promise.all([
    generateAuthTokens(studentUser, device),
    generateAuthTokens(dashboardAdminUser, device),
  ]);

  const checklist = await LearningResourceModel.create({
    key: `interview-checklist-${suffix}`,
    slug: `interview-checklist-${suffix}`,
    type: "checklist",
    audience: ["job_seekers", "students"],
    title: { en: "Interview checklist", ar: "Interview checklist" },
    summary: { en: "Prepare before the interview.", ar: "Prepare before the interview." },
    body: { en: "Check your CV, examples, and setup.", ar: "Check your CV, examples, and setup." },
    tags: ["interview_preparation", "python"],
    language: "both",
    estimated_minutes: 6,
    difficulty: "beginner",
    visibility: "students",
    status: "published",
    featured: true,
    published_at: new Date(),
    created_by: dashboardAdminUser._id,
  });

  const job = await jobsModel.create({
    job_name: "Backend Developer",
    job_name_id: jobNameId,
    description:
      "Build and maintain backend services, APIs, integration workflows, data flows, monitoring, and reliable product features for customers.",
    ref: `INT-PREP-${suffix}`,
    status: true,
    is_accepted: true,
    publish_status: "published",
    started_date: new Date(),
    end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    work_mode_id: lookupId(),
    job_type_id: lookupId(),
    job_time_id: lookupId(),
    job_salary_id: lookupId(),
    salary: {
      currency_id: lookupId(),
      currency_code: "SYP",
      currency_rate_snapshot: 1,
      min: 1000000,
      max: 1500000,
    },
    skills_required: [
      { title: "python", level: 4, years: 2 },
      { title: "api", level: 4, years: 2 },
    ],
    company_id: companyId,
    user_id: companyUser._id,
  });

  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  const invalid = await expectStatus(
    request(baseUrl, "POST", "/dash/v1/interview-prep/questions", {
      token: dashboardAdminTokens.accessToken,
      body: { title_en: "Missing question" },
    }),
    400,
    "dashboard admin cannot create empty interview prep question",
  );
  assert.match(JSON.stringify(invalid.payload), /Question text is required/);

  const created = await expectStatus(
    request(baseUrl, "POST", "/dash/v1/interview-prep/questions", {
      token: dashboardAdminTokens.accessToken,
      body: {
        title_en: "Backend API interview",
        question_en: "Tell me about an API you designed.",
        answer_tips_en: "Explain constraints, tradeoffs, and measurable impact.",
        category: "backend",
        job_name_id: jobNameId,
        audience: ["job_seekers", "students"],
        difficulty: "medium",
        tags: ["python", "api"],
        status: "published",
      },
    }),
    201,
    "dashboard admin creates interview prep question",
  );
  assert.equal(created.payload.data.question, "Tell me about an API you designed.");

  await expectStatus(
    request(baseUrl, "PATCH", `/dash/v1/interview-prep/questions/${created.payload.data.id}`, {
      token: dashboardAdminTokens.accessToken,
      body: { difficulty: "advanced" },
    }),
    200,
    "dashboard admin partially updates interview prep question",
  );
  const preserved = await InterviewPrepQuestionModel.findById(created.payload.data.id).lean();
  assert.equal(
    preserved.question.en,
    "Tell me about an API you designed.",
    "partial PATCH must not clear question text",
  );
  assert.equal(preserved.difficulty, "advanced");

  const adminList = await expectStatus(
    request(baseUrl, "GET", "/dash/v1/interview-prep/questions?status=published", {
      token: dashboardAdminTokens.accessToken,
    }),
    200,
    "dashboard admin lists interview prep question bank",
  );
  assert.ok(adminList.payload.data.some((item) => item.id === created.payload.data.id));

  const overview = await expectStatus(
    request(baseUrl, "GET", "/user/v1/interview-prep", {
      token: studentTokens.accessToken,
      contextId: studentContext._id,
    }),
    200,
    "seeker opens interview prep overview",
  );
  assert.ok(overview.payload.data.questions.some((item) => item.id === created.payload.data.id));
  assert.ok(overview.payload.data.resources.some((item) => item.id === String(checklist._id)));
  assert.ok(overview.payload.data.checklist.length >= 5);

  const questionList = await expectStatus(
    request(baseUrl, "GET", "/user/v1/interview-prep/questions?tag=python", {
      token: studentTokens.accessToken,
      contextId: studentContext._id,
    }),
    200,
    "seeker lists interview prep questions by tag",
  );
  assert.equal(questionList.payload.data.length, 1);
  assert.equal(questionList.payload.data[0].id, created.payload.data.id);

  await expectStatus(
    request(baseUrl, "POST", `/user/v1/interview-prep/questions/${created.payload.data.id}/save-note`, {
      token: studentTokens.accessToken,
      contextId: studentContext._id,
      body: {
        note: "Use the payment API example.",
        saved: true,
        status: "in_progress",
        progress_percent: 40,
      },
    }),
    200,
    "seeker saves interview prep question note",
  );
  const noteProgress = await UserInterviewPrepProgressModel.findOne({
    user_id: studentUser._id,
    question_id: created.payload.data.id,
  }).lean();
  assert.equal(noteProgress.saved, true);
  assert.equal(noteProgress.note, "Use the payment API example.");
  assert.equal(noteProgress.progress_percent, 40);

  const jobPrep = await expectStatus(
    request(baseUrl, "GET", `/user/v1/interview-prep/jobs/${job._id}`, {
      token: studentTokens.accessToken,
      contextId: studentContext._id,
    }),
    200,
    "seeker opens job-specific interview prep",
  );
  assert.equal(jobPrep.payload.data.job.id, String(job._id));
  assert.ok(jobPrep.payload.data.likely_questions.some((item) => item.id === created.payload.data.id));
  assert.ok(jobPrep.payload.data.resources.some((item) => item.id === String(checklist._id)));
  assert.ok(jobPrep.payload.data.checklist.length >= 5);

  await expectStatus(
    request(baseUrl, "PATCH", `/user/v1/interview-prep/checklists/${checklist._id}/progress`, {
      token: studentTokens.accessToken,
      contextId: studentContext._id,
      body: {
        job_id: job._id,
        progress_percent: 100,
        status: "completed",
      },
    }),
    200,
    "seeker completes interview prep checklist",
  );
  const checklistProgress = await UserInterviewPrepProgressModel.findOne({
    user_id: studentUser._id,
    resource_id: checklist._id,
  }).lean();
  assert.equal(checklistProgress.status, "completed");
  assert.equal(checklistProgress.progress_percent, 100);
  assert.equal(String(checklistProgress.job_id), String(job._id));

  await expectStatus(
    request(baseUrl, "DELETE", `/dash/v1/interview-prep/questions/${created.payload.data.id}`, {
      token: dashboardAdminTokens.accessToken,
    }),
    200,
    "dashboard admin archives interview prep question",
  );
  const archived = await InterviewPrepQuestionModel.findById(created.payload.data.id).lean();
  assert.equal(archived.status, "archived");

  console.log(
    "Interview prep integration verified for admin validation/create/list/partial-update/archive, seeker overview/question bank/note saving, job-specific prep, and checklist progress.",
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
