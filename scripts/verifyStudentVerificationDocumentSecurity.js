import assert from "node:assert/strict";
import fs from "fs/promises";
import path from "path";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET ||= "student-verification-document-security-secret";
process.env.ACCESS_TOKEN_EXPIRATION_MINUTES ||= "30";
process.env.REFRESH_TOKEN_EXPIRATION_DAYS ||= "30";
process.env.HEALTH_SECRET ||= "student-verification-document-health-secret";

let mongo;
let server;
const createdFiles = [];

const nowToken = () => new Date().toISOString().replace(/[-:.TZ]/g, "");

function authHeaders(token, contextId, extra = {}) {
  return {
    Accept: "application/json",
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
      ? { ...authHeaders(token, contextId), "Content-Type": "application/json", ...headers }
      : { Accept: "application/json", "Content-Type": "application/json", ...headers },
    ...(hasBody ? { body: JSON.stringify(body || {}) } : {}),
  });
}

async function multipartRequest(baseUrl, pathName, { token, contextId, form }) {
  return fetch(`${baseUrl}${pathName}`, {
    method: "POST",
    headers: authHeaders(token, contextId),
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
  return payload;
}

async function expectRawStatus(responsePromise, expected, label) {
  const response = await responsePromise;
  const body = await response.arrayBuffer();
  assert.equal(response.status, expected, `${label} should return ${expected}; got ${response.status}`);
  return { response, body: Buffer.from(body) };
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

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  mongo = await MongoMemoryServer.create({
    instance: {
      dbName: `halajob-student-verification-document-${nowToken()}`,
    },
  });

  process.env.CONNECTION_URL = mongo.getUri();

  const [{ default: app }, models, tokenService, accountContextService] = await Promise.all([
    import("../app.js"),
    import("../models/index.js"),
    import("../services/tokenService.js"),
    import("../services/accountContext.service.js"),
  ]);

  const {
    AccountContextModel,
    AuditLogModel,
    EmployeeModel,
    RoleModel,
    StudentVerificationModel,
    UniversityMembershipModel,
    UniversityModel,
    UserModel,
  } = models;
  const { generateAuthTokens } = tokenService;
  const { syncAccountContextsForUser } = accountContextService;

  await mongoose.connect(process.env.CONNECTION_URL, {
    serverSelectionTimeoutMS: 10000,
  });

  const suffix = nowToken();
  const phoneSeed = suffix.slice(-8);

  const employeeRole = await RoleModel.create({
    log_to: "employee",
    name: `student-doc-employee-${suffix}`,
    role_number: 992001,
    title_ar: "Employee",
    title_en: "Employee",
    status: true,
    is_system: true,
  });

  const [studentUser, otherStudentUser, universityUserA, universityUserB] = await UserModel.create([
    userSeed({
      firstName: "Document",
      lastName: "Student",
      email: `document.student.${suffix}@alpha.edu`,
      roleId: employeeRole._id,
      phone: `${phoneSeed}01`,
    }),
    userSeed({
      firstName: "Other",
      lastName: "Student",
      email: `document.other.student.${suffix}@alpha.edu`,
      roleId: employeeRole._id,
      phone: `${phoneSeed}02`,
    }),
    userSeed({
      firstName: "Alpha",
      lastName: "Verifier",
      email: `document.verifier.a.${suffix}@alpha.edu`,
      roleId: employeeRole._id,
      phone: `${phoneSeed}03`,
    }),
    userSeed({
      firstName: "Beta",
      lastName: "Verifier",
      email: `document.verifier.b.${suffix}@beta.edu`,
      roleId: employeeRole._id,
      phone: `${phoneSeed}04`,
    }),
  ]);

  const [universityA, universityB] = await UniversityModel.create([
    {
      name: `Document Alpha University ${suffix}`,
      name_en: `Document Alpha University ${suffix}`,
      email_domain: `doc-alpha-${suffix}.edu`,
      career_center_email: universityUserA.email,
      verified: true,
      status: "active",
      city: "Alpha City",
      country: "United States",
    },
    {
      name: `Document Beta University ${suffix}`,
      name_en: `Document Beta University ${suffix}`,
      email_domain: `doc-beta-${suffix}.edu`,
      career_center_email: universityUserB.email,
      verified: true,
      status: "active",
      city: "Beta City",
      country: "United States",
    },
  ]);

  await Promise.all([
    EmployeeModel.create({
      user_id: studentUser._id,
      role_id: employeeRole._id,
      status: true,
      accepted: true,
      is_student: true,
      candidate_stage: "student",
      university: universityA.name,
      university_id: universityA._id,
      student_profile: {
        university: universityA.name,
        university_id: universityA._id,
        student_email: studentUser.email,
      },
    }),
    EmployeeModel.create({
      user_id: otherStudentUser._id,
      role_id: employeeRole._id,
      status: true,
      accepted: true,
      is_student: true,
      candidate_stage: "student",
      university: universityA.name,
      university_id: universityA._id,
      student_profile: {
        university: universityA.name,
        university_id: universityA._id,
        student_email: otherStudentUser.email,
      },
    }),
    UniversityMembershipModel.create({
      university_id: universityA._id,
      user_id: universityUserA._id,
      role: "owner",
      status: "active",
      accepted_at: new Date(),
    }),
    UniversityMembershipModel.create({
      university_id: universityB._id,
      user_id: universityUserB._id,
      role: "owner",
      status: "active",
      accepted_at: new Date(),
    }),
  ]);

  await Promise.all([
    syncAccountContextsForUser(studentUser._id),
    syncAccountContextsForUser(otherStudentUser._id),
    syncAccountContextsForUser(universityUserA._id),
    syncAccountContextsForUser(universityUserB._id),
  ]);

  const [studentContext, otherStudentContext, universityContextA, universityContextB] = await Promise.all([
    AccountContextModel.findOne({ user_id: studentUser._id, context_type: "student" }).lean(),
    AccountContextModel.findOne({ user_id: otherStudentUser._id, context_type: "student" }).lean(),
    AccountContextModel.findOne({ user_id: universityUserA._id, context_type: "university_admin", entity_id: universityA._id }).lean(),
    AccountContextModel.findOne({ user_id: universityUserB._id, context_type: "university_admin", entity_id: universityB._id }).lean(),
  ]);
  assert.ok(studentContext?._id, "student context should exist");
  assert.ok(otherStudentContext?._id, "other student context should exist");
  assert.ok(universityContextA?._id, "university A admin context should exist");
  assert.ok(universityContextB?._id, "university B admin context should exist");

  const device = { brand: "Student Verification Document", model_name: "Integration", is_device: false };
  const [studentTokens, otherStudentTokens, universityTokensA, universityTokensB] = await Promise.all([
    generateAuthTokens(studentUser, device),
    generateAuthTokens(otherStudentUser, device),
    generateAuthTokens(universityUserA, device),
    generateAuthTokens(universityUserB, device),
  ]);

  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  await expectStatus(
    request(baseUrl, "POST", "/campus/v1/verification/upload-document", {
      token: studentTokens.accessToken,
      contextId: studentContext._id,
      body: {
        university_id: universityA._id,
        document_url: "/uploads/public-proof.pdf",
      },
    }),
    422,
    "new student verification should reject public upload-root document URLs"
  );

  const form = new FormData();
  form.append("university_id", String(universityA._id));
  form.append("student_email", studentUser.email);
  form.append("faculty_major", "Computer Science");
  form.append("degree_level", "bachelor");
  form.append("graduation_year", "2028");
  form.append("document", new Blob([Buffer.from("%PDF-1.4\n% private test document\n")], { type: "application/pdf" }), "student-proof.pdf");

  const uploaded = await expectStatus(
    multipartRequest(baseUrl, "/campus/v1/verification/upload-document", {
      token: studentTokens.accessToken,
      contextId: studentContext._id,
      form,
    }),
    202,
    "student verification document upload"
  );
  const verificationId = uploaded.data?.verification?._id;
  assert.ok(mongoose.Types.ObjectId.isValid(String(verificationId)), "upload should return verification id");

  const verification = await StudentVerificationModel.findById(verificationId).lean();
  assert.equal(verification?.method, "document", "verification method should be document");
  assert.match(verification.document_url, /^uploads\/files\/student-verifications\//);

  const fileName = path.basename(verification.document_url);
  const privatePath = path.resolve(process.cwd(), "uploads", "files", "student-verifications", fileName);
  const oldPublicPath = path.resolve(process.cwd(), "uploads", fileName);
  createdFiles.push(privatePath, oldPublicPath);

  assert.equal(await pathExists(privatePath), true, "uploaded document should exist in private document storage");
  assert.equal(await pathExists(oldPublicPath), false, "uploaded document should not remain in public upload root");

  await expectStatus(
    fetch(`${baseUrl}/${verification.document_url}`),
    404,
    "direct public access to private verification document"
  );

  const ownDownload = await expectRawStatus(
    fetch(`${baseUrl}/campus/v1/student-verifications/${verificationId}/document`, {
      headers: authHeaders(studentTokens.accessToken, studentContext._id),
    }),
    200,
    "student owner document download"
  );
  assert.match(ownDownload.response.headers.get("content-disposition") || "", /attachment/i);
  assert.match(ownDownload.response.headers.get("cache-control") || "", /no-store/i);
  assert.equal(ownDownload.response.headers.get("x-content-type-options"), "nosniff");
  assert.ok(ownDownload.body.length > 0, "student owner download should return file bytes");

  await expectStatus(
    fetch(`${baseUrl}/campus/v1/student-verifications/${verificationId}/document`, {
      headers: authHeaders(otherStudentTokens.accessToken, otherStudentContext._id),
    }),
    404,
    "other student document download"
  );

  const adminDownload = await expectRawStatus(
    fetch(`${baseUrl}/university/v1/verifications/${verificationId}/document`, {
      headers: authHeaders(universityTokensA.accessToken, universityContextA._id),
    }),
    200,
    "own university admin document download"
  );
  assert.match(adminDownload.response.headers.get("content-disposition") || "", /attachment/i);
  assert.match(adminDownload.response.headers.get("cache-control") || "", /no-store/i);
  assert.equal(adminDownload.response.headers.get("x-content-type-options"), "nosniff");

  await expectStatus(
    fetch(`${baseUrl}/university/v1/verifications/${verificationId}/document`, {
      headers: authHeaders(universityTokensB.accessToken, universityContextB._id),
    }),
    404,
    "other university admin document download"
  );

  const auditRows = await AuditLogModel.find({
    action: { $in: ["campus_verification_document_uploaded", "campus_verification_document_downloaded"] },
    entity_id: verification._id,
  }).lean();
  assert.ok(
    auditRows.some((row) => row.action === "campus_verification_document_uploaded"),
    "document upload should be audited"
  );
  assert.equal(
    auditRows.filter((row) => row.action === "campus_verification_document_downloaded").length,
    2,
    "student and university admin downloads should be audited"
  );

  console.log("Student verification document security verified for private storage, public denial, scoped downloads, headers, and audit logs.");
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
    await Promise.all(createdFiles.map((filePath) => fs.rm(filePath, { force: true }).catch(() => null)));
  });
