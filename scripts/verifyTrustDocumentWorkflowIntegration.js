import assert from "node:assert/strict";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET ||= "trust-document-integration-secret";
process.env.ACCESS_TOKEN_EXPIRATION_MINUTES ||= "30";
process.env.REFRESH_TOKEN_EXPIRATION_DAYS ||= "30";
process.env.HEALTH_SECRET ||= "trust-document-health-secret";

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
    headers: token ? authHeaders(token, headers) : { Accept: "application/json", "Content-Type": "application/json", ...headers },
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

function jobSeed({ jobId, company, companyUser, suffix }) {
  return {
    _id: jobId,
    job_name: `Trust Evidence Engineer ${suffix}`,
    description:
      "This seeded job has a long enough description for the job model validators and trust document workflow tests.",
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
    trust: {
      score: 42,
      risk_level: "high",
      flags: ["manual_review"],
      report_count: 1,
      review_status: "unreviewed",
    },
  };
}

async function main() {
  mongo = await MongoMemoryServer.create({
    instance: {
      dbName: `halajob-trust-documents-${nowIso()}`,
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
    AuditLogModel,
    CompanyModel,
    EmployeeModel,
    RoleModel,
    UserModel,
    jobsModel,
  } = models;
  const { generateAuthTokens } = tokenService;

  await mongoose.connect(process.env.CONNECTION_URL, {
    serverSelectionTimeoutMS: 10000,
  });

  const suffix = nowIso();
  const [employeeRole, companyRole, adminRole] = await RoleModel.create([
    {
      log_to: "employee",
      name: `trust-doc-employee-${suffix}`,
      role_number: 940001,
      title_ar: "Employee",
      title_en: "Employee",
      status: true,
      is_system: true,
    },
    {
      log_to: "company",
      name: `trust-doc-company-${suffix}`,
      role_number: 940002,
      title_ar: "Company",
      title_en: "Company",
      status: true,
      is_system: true,
    },
    {
      log_to: "dash",
      name: `trust-doc-admin-${suffix}`,
      role_number: 940003,
      title_ar: "Admin",
      title_en: "Admin",
      status: true,
      is_system: true,
    },
  ]);

  const phoneSeed = suffix.slice(-8);
  const [seekerUser, companyUser, otherCompanyUser, adminUser] = await UserModel.create([
    {
      first_name: "Trust",
      last_name: "Seeker",
      email: `trust.seeker.${suffix}@example.com`,
      gender: "male",
      role_id: employeeRole._id,
      password: "not-used",
      status: true,
      phone_e164: `+1555${phoneSeed}01`,
      phone_country: "US",
      phone_code: "+1",
      phone_national: `555${phoneSeed}01`,
    },
    {
      first_name: "Trust",
      last_name: "Company",
      email: `trust.company.${suffix}@example.com`,
      gender: "female",
      role_id: companyRole._id,
      password: "not-used",
      status: true,
      phone_e164: `+1555${phoneSeed}02`,
      phone_country: "US",
      phone_code: "+1",
      phone_national: `555${phoneSeed}02`,
    },
    {
      first_name: "Other",
      last_name: "Company",
      email: `trust.other.company.${suffix}@example.com`,
      gender: "male",
      role_id: companyRole._id,
      password: "not-used",
      status: true,
      phone_e164: `+1555${phoneSeed}03`,
      phone_country: "US",
      phone_code: "+1",
      phone_national: `555${phoneSeed}03`,
    },
    {
      first_name: "Trust",
      last_name: "Admin",
      email: `trust.admin.${suffix}@example.com`,
      gender: "female",
      role_id: adminRole._id,
      password: "not-used",
      status: true,
      phone_e164: `+1555${phoneSeed}04`,
      phone_country: "US",
      phone_code: "+1",
      phone_national: `555${phoneSeed}04`,
    },
  ]);

  const seekerEmployee = await EmployeeModel.create({
    user_id: seekerUser._id,
    role_id: employeeRole._id,
    status: true,
    accepted: true,
    profile_headline: "Trust test seeker",
  });

  const [company, otherCompany] = await CompanyModel.create([
    {
      company_name: `Trust Docs Company ${suffix}`,
      company_email: `trust.docs.${suffix}@company.example.com`,
      owner_user_id: companyUser._id,
      role_id: companyRole._id,
      status: true,
      accepted: true,
      can_upload: true,
      is_verified: true,
      profile_completion: 70,
    },
    {
      company_name: `Trust Docs Other Company ${suffix}`,
      company_email: `trust.docs.other.${suffix}@company.example.com`,
      owner_user_id: otherCompanyUser._id,
      role_id: companyRole._id,
      status: true,
      accepted: true,
      can_upload: true,
      is_verified: true,
      profile_completion: 70,
    },
  ]);

  const [seekerContext, companyContext, otherCompanyContext] = await AccountContextModel.create([
    {
      user_id: seekerUser._id,
      context_key: `job_seeker:${seekerEmployee._id}`,
      context_type: "job_seeker",
      entity_id: seekerEmployee._id,
      entity_model: "employees",
      display_name: "Trust seeker",
      status: "active",
      permissions: ["jobs.search", "jobs.apply"],
      is_default: true,
    },
    {
      user_id: companyUser._id,
      context_key: `company_admin:${company._id}`,
      context_type: "company_admin",
      entity_id: company._id,
      entity_model: "companies",
      display_name: company.company_name,
      status: "active",
      permissions: ["*"],
      is_default: true,
    },
    {
      user_id: otherCompanyUser._id,
      context_key: `company_admin:${otherCompany._id}`,
      context_type: "company_admin",
      entity_id: otherCompany._id,
      entity_model: "companies",
      display_name: otherCompany.company_name,
      status: "active",
      permissions: ["*"],
      is_default: true,
    },
  ]);

  await Promise.all([
    UserModel.updateOne({ _id: seekerUser._id }, { $set: { default_context_id: seekerContext._id } }),
    UserModel.updateOne({ _id: companyUser._id }, { $set: { default_context_id: companyContext._id } }),
    UserModel.updateOne({ _id: otherCompanyUser._id }, { $set: { default_context_id: otherCompanyContext._id } }),
  ]);

  const jobId = objectId();
  await jobsModel.create(jobSeed({ jobId, company, companyUser, suffix }));

  const device = { brand: "test", model_name: "node", is_device: false };
  const [seekerTokens, companyTokens, otherCompanyTokens, adminTokens] = await Promise.all([
    generateAuthTokens(seekerUser, device),
    generateAuthTokens(companyUser, device),
    generateAuthTokens(otherCompanyUser, device),
    generateAuthTokens(adminUser, device),
  ]);

  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  await expectStatus(
    request(baseUrl, "POST", `/trust/v1/jobs/${jobId}/documents`, {
      body: { note: "Before admin request" },
    }),
    401,
    "missing token should not submit trust documents"
  );

  await expectStatus(
    request(baseUrl, "POST", `/trust/v1/jobs/${jobId}/documents`, {
      token: seekerTokens.accessToken,
      body: { note: "Seeker should be rejected" },
    }),
    403,
    "seeker should not submit company trust documents"
  );

  await expectStatus(
    request(baseUrl, "POST", `/trust/v1/jobs/${jobId}/documents`, {
      token: companyTokens.accessToken,
      body: { note: "No request exists yet" },
    }),
    409,
    "company should not submit trust documents before admin request"
  );

  const requestPayload = await expectStatus(
    request(baseUrl, "POST", `/admin/v1/trust/jobs/${jobId}/request-documents`, {
      token: adminTokens.accessToken,
      body: { note: "Please provide registration proof." },
    }),
    200,
    "admin should request documents"
  );
  assert.equal(requestPayload.data.trust.review_status, "needs_documents");
  assert.equal(requestPayload.data.trust.document_request.status, "requested");
  assert.equal(requestPayload.data.trust.document_response.status, "requested");

  await expectStatus(
    request(baseUrl, "POST", `/trust/v1/jobs/${jobId}/documents`, {
      token: companyTokens.accessToken,
      body: { document_links: [{ url: "http://insecure.example.com/license.pdf" }] },
    }),
    422,
    "company document links must use https"
  );

  const unsafeEvidenceUrls = [
    "https://localhost/license.pdf",
    "https://metadata.google.internal/latest/meta-data",
    "https://intranet/license.pdf",
    "https://127.0.0.1/license.pdf",
    "https://0x7f000001/license.pdf",
    "https://2130706433/license.pdf",
    "https://10.0.0.4/license.pdf",
    "https://172.16.0.5/license.pdf",
    "https://192.168.1.20/license.pdf",
    "https://169.254.169.254/latest/meta-data",
    "https://[::1]/license.pdf",
    "https://[::ffff:127.0.0.1]/license.pdf",
    "https://admin:secret@docs.example.com/license.pdf",
  ];
  for (const unsafeUrl of unsafeEvidenceUrls) {
    await expectStatus(
      request(baseUrl, "POST", `/trust/v1/jobs/${jobId}/documents`, {
        token: companyTokens.accessToken,
        body: { document_links: [{ url: unsafeUrl }] },
      }),
      422,
      `unsafe company document link should be rejected: ${unsafeUrl}`
    );
  }

  const rejectedAttemptJob = await jobsModel.findById(jobId).lean();
  assert.equal(
    rejectedAttemptJob.trust.document_response.status,
    "requested",
    "rejected evidence links should not mark trust documents as submitted"
  );

  await expectStatus(
    request(baseUrl, "POST", `/trust/v1/jobs/${jobId}/documents`, {
      token: otherCompanyTokens.accessToken,
      body: {
        note: "Trying to answer another company job.",
        document_links: [{ url: "https://docs.example.com/other-company.pdf" }],
      },
    }),
    404,
    "other company should not access this job"
  );

  const submitPayload = await expectStatus(
    request(baseUrl, "POST", `/trust/v1/jobs/${jobId}/documents`, {
      token: companyTokens.accessToken,
      body: {
        note: "Uploaded company registration proof to secure storage.",
        document_links: [
          {
            url: "https://docs.example.com/company-registration-proof.pdf",
            label: "Company registration proof",
            kind: "registration",
          },
        ],
      },
    }),
    200,
    "owning company should submit trust document response"
  );

  assert.equal(submitPayload.message, "job_documents_submitted");
  assert.equal(submitPayload.data.trust.document_request.status, "submitted");
  assert.equal(submitPayload.data.trust.document_response.status, "submitted");
  assert.equal(submitPayload.data.trust.document_response.links.length, 1);

  const storedJob = await jobsModel.findById(jobId).lean();
  assert.equal(storedJob.trust.document_response.status, "submitted");
  assert.equal(storedJob.trust.document_response.links[0].url, "https://docs.example.com/company-registration-proof.pdf");
  assert.equal(String(storedJob.trust.document_response.submitted_by), String(companyUser._id));

  const queuePayload = await expectStatus(
    request(baseUrl, "GET", "/admin/v1/trust/review-queue?status=all&limit=20", {
      token: adminTokens.accessToken,
    }),
    200,
    "admin review queue should show submitted trust documents"
  );
  const queuedJob = queuePayload.data.find((item) => String(item._id) === String(jobId));
  assert.ok(queuedJob, "admin review queue should include the trust document job");
  assert.equal(queuedJob.trust.document_response.status, "submitted");

  const [auditLog, analyticsEvent] = await Promise.all([
    AuditLogModel.findOne({ action: "trust_job_documents_submitted", job_id: jobId }).lean(),
    AnalyticsEventModel.findOne({ event: "job_trust_documents_submitted", job_id: jobId }).lean(),
  ]);
  assert.ok(auditLog, "trust document submission should write an audit log");
  assert.ok(analyticsEvent, "trust document submission should write an analytics event");

  console.log("Trust document workflow integration verified with seeded MongoDB data.");
}

try {
  await main();
} finally {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase().catch(() => {});
    await mongoose.disconnect();
  }
  if (mongo) {
    await mongo.stop();
  }
}
