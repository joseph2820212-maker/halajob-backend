import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET ||= "employee-cv-download-integration-secret";
process.env.ACCESS_TOKEN_EXPIRATION_MINUTES ||= "30";
process.env.REFRESH_TOKEN_EXPIRATION_DAYS ||= "30";
process.env.HEALTH_SECRET ||= "employee-cv-download-health-secret";

let mongo;
let server;

const nowToken = () => new Date().toISOString().replace(/[-:.TZ]/g, "");

function authHeaders(token, contextId, extra = {}) {
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...extra,
  };
  if (contextId) headers["X-Active-Context-Id"] = String(contextId);
  return headers;
}

async function request(baseUrl, method, pathName, { token, contextId, body, headers } = {}) {
  const hasBody = !["GET", "HEAD"].includes(method);
  return fetch(`${baseUrl}${pathName}`, {
    method,
    headers: token ? authHeaders(token, contextId, headers) : { Accept: "application/json", ...headers },
    ...(hasBody ? { body: JSON.stringify(body || {}) } : {}),
  });
}

async function expectStatus(responsePromise, expected, label, { binary = false } = {}) {
  const response = await responsePromise;
  const body = binary && response.status === expected ? await response.arrayBuffer() : await response.text();
  assert.equal(
    response.status,
    expected,
    `${label} should return ${expected}; got ${response.status}; body=${binary ? `[${body.byteLength} bytes]` : body}`
  );
  return { response, body };
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
    phone: `+1555${phone}`,
    phone_e164: `+1555${phone}`,
    phone_country: "US",
    phone_code: "+1",
    phone_national: `555${phone}`,
  };
}

async function main() {
  mongo = await MongoMemoryServer.create({
    instance: {
      dbName: `halajob-employee-cv-download-${nowToken()}`,
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
  const cvDir = path.resolve(process.cwd(), "cv", "generated");
  const ownFileName = `employee-own-${suffix}.pdf`;
  const otherFileName = `employee-other-${suffix}.pdf`;
  const ownPath = path.join(cvDir, ownFileName);
  const otherPath = path.join(cvDir, otherFileName);
  const cleanupPaths = [ownPath, otherPath];

  await fs.mkdir(cvDir, { recursive: true });
  await Promise.all([
    fs.writeFile(ownPath, Buffer.from("%PDF-1.4\n% own employee cv\n", "utf8")),
    fs.writeFile(otherPath, Buffer.from("%PDF-1.4\n% other employee cv\n", "utf8")),
  ]);

  const employeeRole = await RoleModel.create({
    log_to: "employee",
    name: `employee-cv-download-role-${suffix}`,
    role_number: 4,
    title_ar: "Employee",
    title_en: "Employee",
    status: true,
    is_system: true,
  });

  const [ownerUser, otherUser] = await UserModel.create([
    userSeed({
      firstName: "CV",
      lastName: "Owner",
      email: `cv.owner.${suffix}@example.com`,
      roleId: employeeRole._id,
      phone: `${phoneSeed}01`,
    }),
    userSeed({
      firstName: "CV",
      lastName: "Other",
      email: `cv.other.${suffix}@example.com`,
      roleId: employeeRole._id,
      phone: `${phoneSeed}02`,
    }),
  ]);

  const [ownerEmployee, otherEmployee] = await EmployeeModel.create([
    {
      user_id: ownerUser._id,
      role_id: employeeRole._id,
      status: true,
      accepted: true,
      profile_headline: "Owner CV profile",
    },
    {
      user_id: otherUser._id,
      role_id: employeeRole._id,
      status: true,
      accepted: true,
      profile_headline: "Other CV profile",
    },
  ]);

  const [ownerContext, otherContext] = await AccountContextModel.create([
    {
      user_id: ownerUser._id,
      context_key: `job_seeker:${ownerEmployee._id}`,
      context_type: "job_seeker",
      entity_id: ownerEmployee._id,
      entity_model: "employees",
      display_name: "Owner CV profile",
      status: "active",
      permissions: ["career_passport.manage"],
      is_default: true,
    },
    {
      user_id: otherUser._id,
      context_key: `job_seeker:${otherEmployee._id}`,
      context_type: "job_seeker",
      entity_id: otherEmployee._id,
      entity_model: "employees",
      display_name: "Other CV profile",
      status: "active",
      permissions: ["career_passport.manage"],
      is_default: true,
    },
  ]);

  await Promise.all([
    UserModel.updateOne({ _id: ownerUser._id }, { $set: { default_context_id: ownerContext._id } }),
    UserModel.updateOne({ _id: otherUser._id }, { $set: { default_context_id: otherContext._id } }),
  ]);

  const template = await CvTemplateModel.create({
    key: `employee-cv-download-${suffix}`,
    title_ar: "CV Template",
    title_en: "CV Template",
    html: "<html><body>{{name}}</body></html>",
    css: "body { font-family: Arial; }",
    is_active: true,
    sort_order: 1,
  });

  const [ownCv, otherCv, unsafeCv, missingFileCv] = await EmployeeCvModel.create([
    {
      employee_id: ownerEmployee._id,
      template_id: template._id,
      template_key: template.key,
      title: "Owner Saved CV",
      lang: "en",
      pdf_file: `cv/generated/${ownFileName}`,
      is_default: true,
    },
    {
      employee_id: otherEmployee._id,
      template_id: template._id,
      template_key: template.key,
      title: "Other Saved CV",
      lang: "en",
      pdf_file: `cv/generated/${otherFileName}`,
      is_default: true,
    },
    {
      employee_id: ownerEmployee._id,
      template_id: template._id,
      template_key: template.key,
      title: "Unsafe Saved CV",
      lang: "en",
      pdf_file: "../secret.pdf",
      is_default: false,
    },
    {
      employee_id: ownerEmployee._id,
      template_id: template._id,
      template_key: template.key,
      title: "Missing Saved CV",
      lang: "en",
      pdf_file: `cv/generated/missing-${suffix}.pdf`,
      is_default: false,
    },
  ]);

  const device = { brand: "Employee CV", model_name: "Integration", is_device: false };
  const [ownerTokens, otherTokens] = await Promise.all([
    generateAuthTokens(ownerUser, device),
    generateAuthTokens(otherUser, device),
  ]);

  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  await expectStatus(
    request(baseUrl, "GET", `/employee/v1/cv/download/${ownCv._id}`),
    401,
    "saved CV download missing token"
  );

  const ownDownload = await expectStatus(
    request(baseUrl, "GET", `/employee/v1/cv/download/${ownCv._id}`, {
      token: ownerTokens.accessToken,
      contextId: ownerContext._id,
    }),
    200,
    "owner downloads own saved CV",
    { binary: true }
  );
  assert.match(
    String(ownDownload.response.headers.get("content-disposition") || ""),
    /attachment/i,
    "saved CV download should be an attachment"
  );

  await expectStatus(
    request(baseUrl, "GET", `/employee/v1/cv/download/${ownCv._id}`, {
      token: otherTokens.accessToken,
      contextId: otherContext._id,
    }),
    404,
    "other employee cannot download owner saved CV"
  );

  await expectStatus(
    request(baseUrl, "GET", `/employee/v1/cv/download/${otherCv._id}`, {
      token: ownerTokens.accessToken,
      contextId: ownerContext._id,
    }),
    404,
    "owner cannot download another employee saved CV"
  );

  await expectStatus(
    request(baseUrl, "GET", "/employee/v1/cv/download/not-a-valid-id", {
      token: ownerTokens.accessToken,
      contextId: ownerContext._id,
    }),
    400,
    "saved CV download invalid id"
  );

  await expectStatus(
    request(baseUrl, "GET", `/employee/v1/cv/download/${unsafeCv._id}`, {
      token: ownerTokens.accessToken,
      contextId: ownerContext._id,
    }),
    400,
    "saved CV download unsafe stored path"
  );

  await expectStatus(
    request(baseUrl, "GET", `/employee/v1/cv/download/${missingFileCv._id}`, {
      token: ownerTokens.accessToken,
      contextId: ownerContext._id,
    }),
    404,
    "saved CV download missing file"
  );

  console.log("Employee CV download integration verified for auth, ownership, invalid IDs, unsafe paths, and missing files.");

  await Promise.all(cleanupPaths.map((file) => fs.unlink(file).catch(() => null)));
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
