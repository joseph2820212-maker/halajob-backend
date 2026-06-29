import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET ||= "cv-studio-integration-secret";
process.env.ACCESS_TOKEN_EXPIRATION_MINUTES ||= "30";
process.env.REFRESH_TOKEN_EXPIRATION_DAYS ||= "30";
process.env.HEALTH_SECRET ||= "cv-studio-health-secret";

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

async function multipartRequest(baseUrl, pathName, { token, contextId, form }) {
  return fetch(`${baseUrl}${pathName}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      ...(contextId ? { "X-Active-Context-Id": String(contextId) } : {}),
    },
    body: form,
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

async function expectStatus(responsePromise, expected, label, { text = false } = {}) {
  const response = await responsePromise;
  const payload = text ? await response.text() : await readJson(response);
  assert.equal(
    response.status,
    expected,
    `${label} should return ${expected}; got ${response.status}; body=${JSON.stringify(payload)}`
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
    phone: `+1555${phone}`,
    phone_e164: `+1555${phone}`,
    phone_country: "US",
    phone_code: "+1",
    phone_national: `555${phone}`,
  };
}

function jobSeed({ company, companyUser, countryId, suffix }) {
  return {
    job_name: `CV Studio Application ${suffix}`,
    ref: `CV-STUDIO-${suffix.slice(-10)}`,
    description: "Seeded CV Studio job with enough text to exercise application CV attachment safely.",
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
      currency_code: "SYP",
      currency_rate_snapshot: 1,
      min: 1800000,
      max: 2800000,
    },
    company_id: company._id,
    user_id: companyUser._id,
    skills_required: [{ title: "Customer success", level: 3 }],
    languages: [{ name: "Arabic", level: 5, level_text: "fluent" }],
    is_cv_required: true,
  };
}

async function main() {
  mongo = await MongoMemoryServer.create({
    instance: {
      dbName: `halajob-cv-studio-${nowToken()}`,
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
    CvParseJobModel,
    CvTemplateModel,
    EmployeeCvModel,
    EmployeeModel,
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
  const cvDir = path.resolve(process.cwd(), "cv", "generated");
  const cvFileName = `cv-studio-${suffix}.pdf`;
  const cvPath = path.join(cvDir, cvFileName);
  await fs.mkdir(cvDir, { recursive: true });
  await fs.writeFile(cvPath, Buffer.from("%PDF-1.4\n% cv studio integration\n", "utf8"));

  const [employeeRole, companyRole] = await RoleModel.create([
    {
      log_to: "employee",
      name: `cv-studio-employee-${suffix}`,
      role_number: 991001,
      title_ar: "Employee",
      title_en: "Employee",
      status: true,
      is_system: true,
    },
    {
      log_to: "company",
      name: `cv-studio-company-${suffix}`,
      role_number: 991002,
      title_ar: "Company",
      title_en: "Company",
      status: true,
      is_system: true,
    },
  ]);

  const [ownerUser, otherUser, companyUser] = await UserModel.create([
    userSeed({
      firstName: "CV",
      lastName: "Owner",
      email: `cv.studio.owner.${suffix}@example.com`,
      roleId: employeeRole._id,
      phone: `${phoneSeed}01`,
    }),
    userSeed({
      firstName: "CV",
      lastName: "Other",
      email: `cv.studio.other.${suffix}@example.com`,
      roleId: employeeRole._id,
      phone: `${phoneSeed}02`,
    }),
    userSeed({
      firstName: "CV",
      lastName: "Company",
      email: `cv.studio.company.${suffix}@example.com`,
      roleId: companyRole._id,
      phone: `${phoneSeed}03`,
    }),
  ]);

  const company = await CompanyModel.create({
    company_name: `CV Studio Company ${suffix}`,
    company_email: `cv-studio-${suffix}@company.example.com`,
    owner_user_id: companyUser._id,
    role_id: companyRole._id,
    status: true,
    accepted: true,
    can_upload: true,
    is_verified: true,
    profile_completion: 90,
  });

  const [ownerEmployee, otherEmployee] = await EmployeeModel.create([
    {
      user_id: ownerUser._id,
      role_id: employeeRole._id,
      status: true,
      accepted: true,
      profile_headline: "Customer success specialist",
      current_job_title: "Support lead",
      about_me: "Experienced support specialist with measurable customer operations work and practical team leadership.",
      skills: [{ title: "Customer success", level: 4, years: 3 }],
      education: [{ level: "Bachelor", study: "Business", institution: "Damascus University" }],
      languages: [{ level: 5 }],
    },
    {
      user_id: otherUser._id,
      role_id: employeeRole._id,
      status: true,
      accepted: true,
      profile_headline: "Other profile",
    },
  ]);

  const [ownerContext, otherContext] = await AccountContextModel.create([
    {
      user_id: ownerUser._id,
      context_key: `job_seeker:${ownerEmployee._id}`,
      context_type: "job_seeker",
      entity_id: ownerEmployee._id,
      entity_model: "employees",
      display_name: "CV owner",
      status: "active",
      permissions: ["employee"],
      is_default: true,
    },
    {
      user_id: otherUser._id,
      context_key: `job_seeker:${otherEmployee._id}`,
      context_type: "job_seeker",
      entity_id: otherEmployee._id,
      entity_model: "employees",
      display_name: "CV other",
      status: "active",
      permissions: ["employee"],
      is_default: true,
    },
  ]);

  await Promise.all([
    UserModel.updateOne({ _id: ownerUser._id }, { $set: { default_context_id: ownerContext._id } }),
    UserModel.updateOne({ _id: otherUser._id }, { $set: { default_context_id: otherContext._id } }),
  ]);

  const template = await CvTemplateModel.create({
    key: `cv-studio-${suffix}`,
    title_ar: "CV Template",
    title_en: "CV Template",
    html: "<html><body>{{name}}</body></html>",
    css: "body { font-family: Arial; }",
    is_active: true,
    sort_order: 1,
  });

  const ownerCv = await EmployeeCvModel.create({
    employee_id: ownerEmployee._id,
    template_id: template._id,
    template_key: template.key,
    title: "Owner CV",
    lang: "en",
    pdf_file: `cv/generated/${cvFileName}`,
    source: "upload",
    status: "active",
    visibility: "private",
    is_default: true,
  });

  const device = { brand: "CV Studio", model_name: "Integration", is_device: false };
  const [ownerTokens, otherTokens] = await Promise.all([
    generateAuthTokens(ownerUser, device),
    generateAuthTokens(otherUser, device),
  ]);

  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  const quality = await expectStatus(
    request(baseUrl, "POST", `/employee/v1/cv/${ownerCv._id}/quality-score`, {
      token: ownerTokens.accessToken,
      contextId: ownerContext._id,
    }),
    200,
    "owner scores CV quality"
  );
  assert.ok(quality.payload.data.score >= 70, "quality score should reflect completed profile fields");

  await expectStatus(
    request(baseUrl, "PATCH", `/employee/v1/cv/${ownerCv._id}/visibility`, {
      token: ownerTokens.accessToken,
      contextId: ownerContext._id,
      body: { visibility: "applications_only" },
    }),
    200,
    "owner updates CV visibility"
  );

  const duplicate = await expectStatus(
    request(baseUrl, "POST", `/employee/v1/cv/${ownerCv._id}/duplicate`, {
      token: ownerTokens.accessToken,
      contextId: ownerContext._id,
    }),
    201,
    "owner duplicates CV"
  );
  assert.equal(duplicate.payload.data.status, "draft", "duplicate should be draft");
  assert.equal(duplicate.payload.data.visibility, "private", "duplicate should reset visibility");

  await expectStatus(
    request(baseUrl, "POST", `/employee/v1/cv/${duplicate.payload.data._id}/set-default`, {
      token: ownerTokens.accessToken,
      contextId: ownerContext._id,
    }),
    200,
    "owner sets duplicated CV as default"
  );

  const templates = await expectStatus(
    request(baseUrl, "GET", `/employee/v1/cv/${ownerCv._id}/cover-letter/templates`, {
      token: ownerTokens.accessToken,
      contextId: ownerContext._id,
    }),
    200,
    "owner lists cover letter templates"
  );
  assert.ok(templates.payload.data.length >= 3, "cover letter templates should be available");

  const coverPreview = await expectStatus(
    request(baseUrl, "POST", `/employee/v1/cv/${ownerCv._id}/cover-letter/preview`, {
      token: ownerTokens.accessToken,
      contextId: ownerContext._id,
      body: { template_key: "direct", job_title: "Support lead", company_name: "Hala Job" },
    }),
    200,
    "owner previews cover letter"
  );
  assert.match(coverPreview.payload.data.text, /Support lead/, "cover preview should include job context");

  const coverDownload = await expectStatus(
    request(baseUrl, "POST", `/employee/v1/cv/${ownerCv._id}/cover-letter/download`, {
      token: ownerTokens.accessToken,
      contextId: ownerContext._id,
      body: { template_key: "direct" },
    }),
    200,
    "owner downloads cover letter",
    { text: true }
  );
  assert.match(coverDownload.payload, /Customer success specialist|Support lead/, "download should contain letter text");

  const parseForm = new FormData();
  parseForm.append("cv", new Blob([Buffer.from("%PDF-1.4\n% parser upload\n", "utf8")], { type: "application/pdf" }), "parser-cv.pdf");
  const parseUpload = await expectStatus(
    multipartRequest(baseUrl, "/employee/v1/cv/parse/upload", {
      token: ownerTokens.accessToken,
      contextId: ownerContext._id,
      form: parseForm,
    }),
    201,
    "owner uploads CV for parsing"
  );
  assert.equal(parseUpload.payload.data.parse_job.status, "failed", "parser MVP should fail honestly without provider");
  assert.equal(parseUpload.payload.data.parse_job.error_code, "cv_parser_not_configured");

  await expectStatus(
    request(baseUrl, "GET", `/employee/v1/cv/parse/jobs/${parseUpload.payload.data.parse_job._id}`, {
      token: otherTokens.accessToken,
      contextId: otherContext._id,
    }),
    404,
    "other seeker cannot read owner parse job"
  );

  const parsedJob = await CvParseJobModel.create({
    user_id: ownerUser._id,
    employee_id: ownerEmployee._id,
    cv_id: ownerCv._id,
    file_path: `cv/generated/${cvFileName}`,
    original_name: "confirmed-cv.pdf",
    mime_type: "application/pdf",
    provider: "manual",
    status: "parsed",
    normalized_result: {
      profile_headline: "Parsed CV headline",
      current_job_title: "Parsed support lead",
      about_me: "Parsed CV summary with enough detail to update the employee profile safely.",
      skills: ["Operations", "Customer success"],
    },
    confidence: 0.75,
  });

  await expectStatus(
    request(baseUrl, "POST", `/employee/v1/cv/parse/jobs/${parsedJob._id}/confirm`, {
      token: ownerTokens.accessToken,
      contextId: ownerContext._id,
    }),
    200,
    "owner confirms parsed CV"
  );
  const updatedEmployee = await EmployeeModel.findById(ownerEmployee._id).lean();
  assert.equal(updatedEmployee.profile_headline, "Parsed CV headline", "confirm should update owner profile");

  const rejectedJob = await CvParseJobModel.create({
    user_id: ownerUser._id,
    employee_id: ownerEmployee._id,
    cv_id: ownerCv._id,
    file_path: `cv/generated/${cvFileName}`,
    original_name: "reject-cv.pdf",
    mime_type: "application/pdf",
    provider: "manual",
    status: "parsed",
    normalized_result: { profile_headline: "Should not apply" },
    confidence: 0.5,
  });
  await expectStatus(
    request(baseUrl, "POST", `/employee/v1/cv/parse/jobs/${rejectedJob._id}/reject`, {
      token: ownerTokens.accessToken,
      contextId: ownerContext._id,
    }),
    200,
    "owner rejects parsed CV"
  );

  const job = await jobsModel.create(jobSeed({ company, companyUser, countryId, suffix }));
  const apply = await expectStatus(
    request(baseUrl, "POST", `/user/v1/applying-job/insert/${job._id}`, {
      token: ownerTokens.accessToken,
      contextId: ownerContext._id,
      body: { cv_id: ownerCv._id, cover_letter: "Applying with selected CV." },
    }),
    201,
    "owner applies with selected CV"
  );
  assert.equal(String(apply.payload.data.application.cv_id), String(ownerCv._id), "application should store selected cv_id");
  assert.equal(apply.payload.data.application.cv_snapshot.title, "Owner CV", "application should snapshot selected CV metadata");
  assert.equal(apply.payload.data.application.cv_snapshot.public_download_token, undefined, "snapshot must not expose public token");

  const storedApplication = await UserApplyingJobModel.findById(apply.payload.data.application._id).lean();
  assert.equal(String(storedApplication.cv_id), String(ownerCv._id), "stored application should keep selected cv_id");
  assert.equal(storedApplication.cv_snapshot.file_path, `/cv/generated/${cvFileName}`, "stored snapshot should keep private file path");
  const attachedCv = await EmployeeCvModel.findById(ownerCv._id).lean();
  assert.equal(attachedCv.attached_application_count, 1, "selected CV should count application attachment");

  console.log("CV Studio integration verified for quality scoring, visibility, duplication, defaulting, parser ownership, parse confirmation/rejection, cover letters, and selected CV application snapshots.");

  await fs.unlink(cvPath).catch(() => null);
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
