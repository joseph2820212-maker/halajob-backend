import assert from "node:assert/strict";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET ||= "talent-pool-crm-integration-secret";
process.env.ACCESS_TOKEN_EXPIRATION_MINUTES ||= "30";
process.env.REFRESH_TOKEN_EXPIRATION_DAYS ||= "30";
process.env.HEALTH_SECRET ||= "talent-pool-crm-health-secret";

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
    phone: `+1556${phone}`,
    phone_e164: `+1556${phone}`,
    phone_country: "US",
    phone_code: "+1",
    phone_national: `556${phone}`,
  };
}

function jobSeed({ company, companyUser, countryId, suffix, title }) {
  return {
    job_name: `${title} ${suffix}`,
    ref: `CRM-${title.replace(/[^A-Za-z0-9]+/g, "-").slice(0, 18)}-${suffix.slice(-10)}`,
    description: "Company talent pool integration job with enough detail to pass validation and exercise CRM invitations.",
    status: true,
    is_accepted: true,
    publish_status: "published",
    started_date: new Date(Date.now() - 24 * 60 * 60 * 1000),
    end_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    apply_deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
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
      min: 2200,
      max: 3600,
    },
    company_id: company._id,
    user_id: companyUser._id,
    skills_required: [{ title: "CRM recruiting", level: 3 }],
    languages: [{ name: "English", level: 5, level_text: "fluent" }],
    is_cv_required: true,
  };
}

async function main() {
  mongo = await MongoMemoryServer.create({
    instance: { dbName: `halajob-talent-pool-crm-${nowToken()}` },
  });
  process.env.CONNECTION_URL = mongo.getUri();

  const [{ default: app }, models, tokenService] = await Promise.all([
    import("../app.js"),
    import("../models/index.js"),
    import("../services/tokenService.js"),
  ]);

  const {
    AccountContextModel,
    CompanyCandidateNoteModel,
    CompanyModel,
    CompanySavedCandidateModel,
    EmployeeModel,
    JobInvitationModel,
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
      name: `talent-pool-employee-${suffix}`,
      role_number: 992001,
      title_ar: "Employee",
      title_en: "Employee",
      status: true,
      is_system: true,
    },
    {
      log_to: "company",
      name: `talent-pool-company-${suffix}`,
      role_number: 992002,
      title_ar: "Company",
      title_en: "Company",
      status: true,
      is_system: true,
    },
  ]);

  const [companyUserA, companyUserB, applicantUser, privateUser] = await UserModel.create([
    userSeed({ firstName: "Talent", lastName: "CompanyA", email: `talent.company.a.${suffix}@example.com`, roleId: companyRole._id, phone: `${phoneSeed}01` }),
    userSeed({ firstName: "Talent", lastName: "CompanyB", email: `talent.company.b.${suffix}@example.com`, roleId: companyRole._id, phone: `${phoneSeed}02` }),
    userSeed({ firstName: "Talent", lastName: "Applicant", email: `talent.applicant.${suffix}@example.com`, roleId: employeeRole._id, phone: `${phoneSeed}03` }),
    userSeed({ firstName: "Talent", lastName: "Private", email: `talent.private.${suffix}@example.com`, roleId: employeeRole._id, phone: `${phoneSeed}04` }),
  ]);

  const [companyA, companyB] = await CompanyModel.create([
    {
      company_name: `Talent Alpha ${suffix}`,
      company_email: `talent-alpha-${suffix}@company.example.com`,
      owner_user_id: companyUserA._id,
      role_id: companyRole._id,
      status: true,
      accepted: true,
      can_upload: true,
      is_verified: true,
      profile_completion: 90,
    },
    {
      company_name: `Talent Beta ${suffix}`,
      company_email: `talent-beta-${suffix}@company.example.com`,
      owner_user_id: companyUserB._id,
      role_id: companyRole._id,
      status: true,
      accepted: true,
      can_upload: true,
      is_verified: true,
      profile_completion: 90,
    },
  ]);

  const [applicantEmployee, privateEmployee] = await EmployeeModel.create([
    {
      user_id: applicantUser._id,
      role_id: employeeRole._id,
      status: true,
      accepted: true,
      profile_headline: "Applicant visible through owned application",
      current_job_title: "Customer success specialist",
      candidate_stage: "experienced",
      profile_completion: 80,
      cvs: [{ url: "uploads/files/talent-applicant-cv.pdf", fileName: "talent-applicant-cv.pdf", status: "active" }],
    },
    {
      user_id: privateUser._id,
      role_id: employeeRole._id,
      status: true,
      accepted: true,
      profile_headline: "Private applicant without company relationship",
      current_job_title: "Private profile",
      candidate_stage: "experienced",
      profile_visibility: "private",
      profile_completion: 70,
      cvs: [{ url: "uploads/files/talent-private-cv.pdf", fileName: "talent-private-cv.pdf", status: "active" }],
    },
  ]);

  const [contextCompanyA, contextCompanyB] = await AccountContextModel.create([
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
  ]);

  await Promise.all([
    UserModel.updateOne({ _id: companyUserA._id }, { $set: { default_context_id: contextCompanyA._id } }),
    UserModel.updateOne({ _id: companyUserB._id }, { $set: { default_context_id: contextCompanyB._id } }),
  ]);

  const [jobA, futureJobA] = await jobsModel.create([
    jobSeed({ company: companyA, companyUser: companyUserA, countryId, suffix, title: "Talent Source" }),
    jobSeed({ company: companyA, companyUser: companyUserA, countryId, suffix: `${suffix}-future`, title: "Future CRM Role" }),
  ]);

  const application = await UserApplyingJobModel.create({
    user_id: applicantUser._id,
    employee_id: applicantEmployee._id,
    job_id: jobA._id,
    company_id: companyA._id,
    first_name: "Talent",
    last_name: "Applicant",
    email: applicantUser.email,
    phone_code: "+1",
    phone_national: `556${phoneSeed}99`,
    country_id: countryId,
    answers: [],
    cv: "uploads/files/talent-applicant-cv.pdf",
    cover_letter: "Seeded application for talent pool CRM workflow.",
    source: "app",
    status: "new",
    last_activity_at: new Date(),
  });

  const device = { brand: "Talent Pool CRM", model_name: "Integration", is_device: false };
  const [companyATokens, companyBTokens] = await Promise.all([
    generateAuthTokens(companyUserA, device),
    generateAuthTokens(companyUserB, device),
  ]);

  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  const saved = await expectStatus(
    request(baseUrl, "POST", "/company/v1/talent-pool/candidates", {
      token: companyATokens.accessToken,
      contextId: contextCompanyA._id,
      body: {
        application_id: application._id,
        rating: 4,
        tags: ["shortlist", "customer-success"],
      },
    }),
    201,
    "company should save an applicant it owns to the talent pool"
  );
  const savedCandidateId = saved.data?._id;
  assert.ok(mongoose.Types.ObjectId.isValid(String(savedCandidateId)), "saved candidate id should be returned");
  assert.equal(saved.data?.employee?.email, applicantUser.email, "saved candidate should include employee summary");

  const list = await expectStatus(
    request(baseUrl, "GET", "/company/v1/talent-pool?search=customer", {
      token: companyATokens.accessToken,
      contextId: contextCompanyA._id,
    }),
    200,
    "company should list saved talent-pool candidates"
  );
  assert.ok(Array.isArray(list.data) && list.data.some((item) => String(item._id) === String(savedCandidateId)), "talent pool list should include saved candidate");

  await expectStatus(
    request(baseUrl, "GET", `/company/v1/talent-pool/candidates/${savedCandidateId}`, {
      token: companyBTokens.accessToken,
      contextId: contextCompanyB._id,
    }),
    404,
    "another company cannot view saved candidate detail"
  );

  const note = await expectStatus(
    request(baseUrl, "POST", `/company/v1/talent-pool/candidates/${savedCandidateId}/notes`, {
      token: companyATokens.accessToken,
      contextId: contextCompanyA._id,
      body: { note: "Strong phone screen; follow up next week.", visibility: "team" },
    }),
    201,
    "company should add private CRM note"
  );
  assert.equal(note.data?.note, "Strong phone screen; follow up next week.", "note text should persist");

  const notes = await expectStatus(
    request(baseUrl, "GET", `/company/v1/talent-pool/candidates/${savedCandidateId}/notes`, {
      token: companyATokens.accessToken,
      contextId: contextCompanyA._id,
    }),
    200,
    "company should list private CRM notes"
  );
  assert.equal(notes.data?.length, 1, "notes endpoint should return the saved note");

  const tagged = await expectStatus(
    request(baseUrl, "POST", `/company/v1/talent-pool/candidates/${savedCandidateId}/tags`, {
      token: companyATokens.accessToken,
      contextId: contextCompanyA._id,
      body: { tags: "warm, priority" },
    }),
    200,
    "company should add tags"
  );
  assert.ok(tagged.data?.tags?.includes("warm"), "warm tag should be present");
  assert.ok(tagged.data?.tags?.includes("priority"), "priority tag should be present");

  const untagged = await expectStatus(
    request(baseUrl, "DELETE", `/company/v1/talent-pool/candidates/${savedCandidateId}/tags/warm`, {
      token: companyATokens.accessToken,
      contextId: contextCompanyA._id,
    }),
    200,
    "company should remove tag"
  );
  assert.ok(!untagged.data?.tags?.includes("warm"), "warm tag should be removed");

  const invited = await expectStatus(
    request(baseUrl, "POST", `/company/v1/talent-pool/candidates/${savedCandidateId}/invite-to-job`, {
      token: companyATokens.accessToken,
      contextId: contextCompanyA._id,
      body: {
        job_id: futureJobA._id,
        message: "We would like to invite you to a future role.",
      },
    }),
    201,
    "company should invite saved candidate to an owned job"
  );
  assert.equal(String(invited.data?.invitation?.job_id), String(futureJobA._id), "invitation should target requested job");

  const storedInvite = await JobInvitationModel.findOne({
    job_id: futureJobA._id,
    employee_id: applicantEmployee._id,
  }).lean();
  assert.ok(storedInvite, "job invitation should be stored");

  const dnc = await expectStatus(
    request(baseUrl, "POST", `/company/v1/talent-pool/candidates/${savedCandidateId}/do-not-contact`, {
      token: companyATokens.accessToken,
      contextId: contextCompanyA._id,
    }),
    200,
    "company should mark candidate do-not-contact"
  );
  assert.equal(dnc.data?.status, "do_not_contact", "candidate status should be do-not-contact");

  await expectStatus(
    request(baseUrl, "POST", `/company/v1/talent-pool/candidates/${savedCandidateId}/invite-to-job`, {
      token: companyATokens.accessToken,
      contextId: contextCompanyA._id,
      body: { job_id: futureJobA._id },
    }),
    409,
    "do-not-contact candidate cannot be invited again"
  );

  await expectStatus(
    request(baseUrl, "POST", "/company/v1/talent-pool/candidates", {
      token: companyATokens.accessToken,
      contextId: contextCompanyA._id,
      body: { employee_id: privateEmployee._id },
    }),
    403,
    "company cannot save a private candidate without an application, invitation, or campus opt-in"
  );

  await expectStatus(
    request(baseUrl, "POST", "/company/v1/talent-pool/candidates", {
      token: companyBTokens.accessToken,
      contextId: contextCompanyB._id,
      body: { application_id: application._id },
    }),
    404,
    "other company cannot save a candidate from another company's application"
  );

  const storedCandidate = await CompanySavedCandidateModel.findById(savedCandidateId).lean();
  const storedNote = await CompanyCandidateNoteModel.findOne({ saved_candidate_id: savedCandidateId }).lean();
  assert.equal(storedCandidate.status, "do_not_contact", "saved candidate should retain do-not-contact status");
  assert.equal(storedNote.note, "Strong phone screen; follow up next week.", "private note should remain company-scoped");

  console.log("Company talent-pool CRM integration verified for save, privacy, notes, tags, invitations, and do-not-contact.");
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
