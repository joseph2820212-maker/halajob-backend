import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET ||= "cv-parsing-integration-secret";
process.env.ACCESS_TOKEN_EXPIRATION_MINUTES ||= "30";
process.env.REFRESH_TOKEN_EXPIRATION_DAYS ||= "30";
process.env.HEALTH_SECRET ||= "cv-parsing-health-secret";

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

async function expectStatus(responsePromise, expected, label) {
  const response = await responsePromise;
  const payload = await readJson(response);
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

function assertNoRawParserData(payload, label) {
  const text = JSON.stringify(payload);
  assert.equal(text.includes("raw_result"), false, `${label} must not expose raw parser payloads`);
  assert.equal(text.includes("secret-parser-token"), false, `${label} must not expose hidden parser details`);
}

async function main() {
  mongo = await MongoMemoryServer.create({
    instance: {
      dbName: `halajob-cv-parsing-${nowToken()}`,
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
    CvParseJobModel,
    CvTemplateModel,
    EmployeeCvModel,
    EmployeeModel,
    RoleModel,
    UserModel,
  } = models;
  const { generateAuthTokens } = tokenService;

  await mongoose.connect(process.env.CONNECTION_URL, {
    serverSelectionTimeoutMS: 10000,
  });

  const suffix = nowToken();
  const phoneSeed = suffix.slice(-8);

  const role = await RoleModel.create({
    log_to: "employee",
    name: `cv-parsing-employee-${suffix}`,
    role_number: 991101,
    title_ar: "Employee",
    title_en: "Employee",
    status: true,
    is_system: true,
  });

  const [ownerUser, otherUser] = await UserModel.create([
    userSeed({
      firstName: "Parse",
      lastName: "Owner",
      email: `cv.parse.owner.${suffix}@example.com`,
      roleId: role._id,
      phone: `${phoneSeed}01`,
    }),
    userSeed({
      firstName: "Parse",
      lastName: "Other",
      email: `cv.parse.other.${suffix}@example.com`,
      roleId: role._id,
      phone: `${phoneSeed}02`,
    }),
  ]);

  const [ownerEmployee, otherEmployee] = await EmployeeModel.create([
    {
      user_id: ownerUser._id,
      role_id: role._id,
      status: true,
      accepted: true,
      profile_headline: "Original headline",
      current_job_title: "Original role",
      about_me: "Original profile summary.",
    },
    {
      user_id: otherUser._id,
      role_id: role._id,
      status: true,
      accepted: true,
      profile_headline: "Other headline",
    },
  ]);

  const [ownerContext, otherContext] = await AccountContextModel.create([
    {
      user_id: ownerUser._id,
      context_key: `job_seeker:${ownerEmployee._id}`,
      context_type: "job_seeker",
      entity_id: ownerEmployee._id,
      entity_model: "employees",
      display_name: "CV parse owner",
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
      display_name: "CV parse other",
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
    key: `cv-parsing-${suffix}`,
    title_ar: "CV Template",
    title_en: "CV Template",
    html: "<html><body>{{name}}</body></html>",
    css: "body { font-family: Arial; }",
    is_active: true,
    sort_order: 1,
  });

  const cvDir = path.resolve(process.cwd(), "cv", "generated");
  const cvFileName = `cv-parsing-${suffix}.pdf`;
  const cvPath = path.join(cvDir, cvFileName);
  await fs.mkdir(cvDir, { recursive: true });
  await fs.writeFile(cvPath, Buffer.from("%PDF-1.4\n% cv parsing integration\n", "utf8"));

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

  const device = { brand: "CV Parsing", model_name: "Integration", is_device: false };
  const [ownerTokens, otherTokens] = await Promise.all([
    generateAuthTokens(ownerUser, device),
    generateAuthTokens(otherUser, device),
  ]);

  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  const parseForm = new FormData();
  parseForm.append(
    "cv",
    new Blob([Buffer.from("%PDF-1.4\n% parser upload\n", "utf8")], { type: "application/pdf" }),
    "parser-cv.pdf"
  );
  const parseUpload = await expectStatus(
    multipartRequest(baseUrl, "/employee/v1/cv/parse/upload", {
      token: ownerTokens.accessToken,
      contextId: ownerContext._id,
      form: parseForm,
    }),
    201,
    "owner uploads CV for parsing"
  );
  assert.equal(parseUpload.payload.data.parse_job.status, "failed", "disabled parser should fail honestly");
  assert.equal(parseUpload.payload.data.parse_job.error_code, "cv_parser_not_configured");
  assert.equal(parseUpload.payload.data.cv.source, "parsed_upload");
  assert.equal(parseUpload.payload.data.cv.status, "draft", "unparsed upload should remain draft");
  assertNoRawParserData(parseUpload.payload, "parse upload response");

  const uploadedCvPath = path.resolve(process.cwd(), parseUpload.payload.data.cv.pdf_file);

  const ownerPreviewFailed = await expectStatus(
    request(baseUrl, "GET", `/employee/v1/cv/parse/jobs/${parseUpload.payload.data.parse_job._id}/preview`, {
      token: ownerTokens.accessToken,
      contextId: ownerContext._id,
    }),
    200,
    "owner previews failed parse job"
  );
  assert.equal(ownerPreviewFailed.payload.data.status, "failed");
  assertNoRawParserData(ownerPreviewFailed.payload, "failed parse preview");

  await expectStatus(
    request(baseUrl, "POST", `/employee/v1/cv/parse/jobs/${parseUpload.payload.data.parse_job._id}/confirm`, {
      token: ownerTokens.accessToken,
      contextId: ownerContext._id,
    }),
    409,
    "owner cannot confirm unparsed job"
  );

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
    raw_result: { providerSecret: "secret-parser-token" },
    normalized_result: {
      profile_headline: "Parsed CV headline",
      current_job_title: "Parsed support lead",
      about_me: "Parsed CV summary with enough detail to update the employee profile safely.",
      skills: ["Operations", "Customer success"],
    },
    confidence: 0.82,
  });

  const parsedPreview = await expectStatus(
    request(baseUrl, "GET", `/employee/v1/cv/parse/jobs/${parsedJob._id}/preview`, {
      token: ownerTokens.accessToken,
      contextId: ownerContext._id,
    }),
    200,
    "owner previews parsed job"
  );
  assert.equal(parsedPreview.payload.data.normalized_result.profile_headline, "Parsed CV headline");
  assert.equal(parsedPreview.payload.data.confidence, 0.82);
  assertNoRawParserData(parsedPreview.payload, "parsed preview");

  await expectStatus(
    request(baseUrl, "GET", `/employee/v1/cv/parse/jobs/${parsedJob._id}/preview`, {
      token: otherTokens.accessToken,
      contextId: otherContext._id,
    }),
    404,
    "other seeker cannot preview owner parsed job"
  );

  await expectStatus(
    request(baseUrl, "POST", `/employee/v1/cv/parse/jobs/${parsedJob._id}/confirm`, {
      token: otherTokens.accessToken,
      contextId: otherContext._id,
    }),
    404,
    "other seeker cannot confirm owner parsed job"
  );

  await expectStatus(
    request(baseUrl, "POST", `/employee/v1/cv/parse/jobs/${parsedJob._id}/confirm`, {
      token: ownerTokens.accessToken,
      contextId: ownerContext._id,
    }),
    200,
    "owner confirms parsed job"
  );
  const updatedEmployee = await EmployeeModel.findById(ownerEmployee._id).lean();
  assert.equal(updatedEmployee.profile_headline, "Parsed CV headline", "confirm should apply normalized headline");
  const activatedCv = await EmployeeCvModel.findById(ownerCv._id).lean();
  assert.equal(activatedCv.source, "parsed_upload", "confirm should mark linked CV as parsed upload");
  assert.equal(activatedCv.status, "active", "confirm should activate linked CV");
  assert.ok(activatedCv.last_parsed_at, "confirm should set last_parsed_at");

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
    "owner rejects parsed job"
  );
  const rejected = await CvParseJobModel.findById(rejectedJob._id).lean();
  assert.equal(rejected.status, "rejected", "reject should update parse job status");
  const afterRejectEmployee = await EmployeeModel.findById(ownerEmployee._id).lean();
  assert.equal(afterRejectEmployee.profile_headline, "Parsed CV headline", "reject must not apply normalized data");

  await fs.unlink(cvPath).catch(() => null);
  await fs.unlink(uploadedCvPath).catch(() => null);

  console.log("CV parsing integration verified for upload honesty, ownership, preview redaction, confirmation, rejection, and linked CV activation.");
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
