import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET ||= "file-export-audit-integration-secret";
process.env.ACCESS_TOKEN_EXPIRATION_MINUTES ||= "30";
process.env.REFRESH_TOKEN_EXPIRATION_DAYS ||= "30";
process.env.HEALTH_SECRET ||= "file-export-audit-health-secret";

const nowToken = () => new Date().toISOString().replace(/[-:.TZ]/g, "");
const objectId = () => new mongoose.Types.ObjectId();

function authHeaders(token, contextId, extra = {}) {
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    "X-Active-Context-Id": String(contextId),
    ...extra,
  };
}

async function request(baseUrl, method, pathName, { token, contextId, body, headers } = {}) {
  const hasBody = !["GET", "HEAD"].includes(method);
  return fetch(`${baseUrl}${pathName}`, {
    method,
    headers: token ? authHeaders(token, contextId, headers) : { Accept: "application/json", ...headers },
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

async function expectStatus(responsePromise, expected, label, { binary = false } = {}) {
  const response = await responsePromise;
  if (binary) {
    await response.arrayBuffer();
  } else {
    await readJson(response);
  }
  assert.equal(response.status, expected, `${label} should return ${expected}; got ${response.status}`);
  return response;
}

async function waitForAudit(AuditLogModel, filter, label) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const found = await AuditLogModel.findOne(filter).lean();
    if (found) return found;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  assert.fail(`${label} audit log was not written`);
}

async function main() {
  const mongo = await MongoMemoryServer.create({
    instance: {
      dbName: `halajob-file-export-audit-${nowToken()}`,
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
    AuditLogModel,
    CompanyModel,
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
  const cvFileName = `audit-cv-${suffix}.pdf`;
  const companyFileName = `audit-company-file-${suffix}.pdf`;
  const cvPath = path.resolve(process.cwd(), "cv", "cvUpload", cvFileName);
  const companyFilePath = path.resolve(process.cwd(), "uploads", "files", companyFileName);

  await fs.mkdir(path.dirname(cvPath), { recursive: true });
  await fs.mkdir(path.dirname(companyFilePath), { recursive: true });
  await fs.writeFile(cvPath, Buffer.from("%PDF-1.4\n% audit cv\n", "utf8"));
  await fs.writeFile(companyFilePath, Buffer.from("%PDF-1.4\n% audit company file\n", "utf8"));

  const companyRole = await RoleModel.create({
    log_to: "company",
    name: `file-audit-company-${suffix}`,
    role_number: 940001,
    title_ar: "Company",
    title_en: "Company",
    status: true,
    is_system: true,
  });

  const [companyUser, seekerUser] = await UserModel.create([
    {
      first_name: "File",
      last_name: "Company",
      email: `file.company.${suffix}@example.com`,
      gender: "female",
      role_id: companyRole._id,
      password: "not-used",
      status: true,
      phone: `+1555${phoneSeed}01`,
      phone_e164: `+1555${phoneSeed}01`,
      phone_country: "US",
      phone_code: "+1",
      phone_national: `555${phoneSeed}01`,
    },
    {
      first_name: "File",
      last_name: "Seeker",
      email: `file.seeker.${suffix}@example.com`,
      gender: "male",
      role_id: companyRole._id,
      password: "not-used",
      status: true,
      phone: `+1555${phoneSeed}02`,
      phone_e164: `+1555${phoneSeed}02`,
      phone_country: "US",
      phone_code: "+1",
      phone_national: `555${phoneSeed}02`,
    },
  ]);

  const company = await CompanyModel.create({
    company_name: `File Audit Company ${suffix}`,
    company_email: `file.audit.${suffix}@company.example.com`,
    owner_user_id: companyUser._id,
    role_id: companyRole._id,
    status: true,
    accepted: true,
    is_verified: true,
    can_upload: true,
    files: [companyFileName],
    profile_completion: 80,
  });

  const companyContext = await AccountContextModel.create({
    user_id: companyUser._id,
    context_key: `company_admin:${company._id}`,
    context_type: "company_admin",
    entity_id: company._id,
    entity_model: "companies",
    display_name: company.company_name,
    status: "active",
    permissions: ["*"],
    is_default: true,
  });

  await UserModel.updateOne({ _id: companyUser._id }, { $set: { default_context_id: companyContext._id } });

  const job = await jobsModel.create({
    job_name: `File Audit Job ${suffix}`,
    description: "This is a seeded job description for file export audit integration coverage.",
    work_mode_id: objectId(),
    job_type_id: objectId(),
    job_time_id: objectId(),
    job_salary_id: objectId(),
    salary: {
      currency_id: objectId(),
      currency_code: "USD",
      currency_rate_snapshot: 1,
    },
    company_id: company._id,
    user_id: companyUser._id,
    status: true,
    is_accepted: true,
    publish_status: "published",
  });

  const application = await UserApplyingJobModel.create({
    user_id: seekerUser._id,
    job_id: job._id,
    company_id: company._id,
    first_name: seekerUser.first_name,
    last_name: seekerUser.last_name,
    email: seekerUser.email,
    phone_code: seekerUser.phone_code,
    phone_national: seekerUser.phone_national,
    country_id: objectId(),
    cv: `/cv/cvUpload/${cvFileName}`,
    cover_letter: "Seeded cover letter",
    status: "new",
  });

  const tokens = await generateAuthTokens(companyUser, {
    brand: "File Audit Browser",
    model_name: "Integration",
    is_device: false,
  });

  const server = app.listen(0);

  try {
    await new Promise((resolve) => server.once("listening", resolve));
    const { port } = server.address();
    const baseUrl = `http://127.0.0.1:${port}`;

    await expectStatus(
      request(baseUrl, "GET", `/company/v1/global/profile/files/${encodeURIComponent(companyFileName)}/download`, {
        token: tokens.accessToken,
        contextId: companyContext._id,
      }),
      200,
      "company profile file download",
      { binary: true }
    );

    await waitForAudit(
      AuditLogModel,
      {
        action: "company_file_downloaded",
        company_id: company._id,
        entity_id: company._id,
        "metadata.filename": companyFileName,
      },
      "company file download"
    );

    const traversalResponse = await request(
      baseUrl,
      "GET",
      "/company/v1/global/profile/files/%2e%2e%2fsecret.pdf/download",
      {
        token: tokens.accessToken,
        contextId: companyContext._id,
      }
    );
    await traversalResponse.text();
    assert.ok(
      [400, 404].includes(traversalResponse.status),
      `company file traversal should fail safely; got ${traversalResponse.status}`
    );

    await expectStatus(
      request(baseUrl, "GET", `/company/v1/jobs/hiring/applications/${application._id}/cv`, {
        token: tokens.accessToken,
        contextId: companyContext._id,
      }),
      200,
      "single application CV download",
      { binary: true }
    );

    await waitForAudit(
      AuditLogModel,
      {
        action: "application_cv_downloaded",
        company_id: company._id,
        application_id: application._id,
      },
      "single CV download"
    );

    await expectStatus(
      request(baseUrl, "POST", "/company/v1/jobs/hiring/applications/bulk-cv", {
        token: tokens.accessToken,
        contextId: companyContext._id,
        body: {
          application_ids: [String(application._id)],
        },
      }),
      200,
      "bulk application CV ZIP export",
      { binary: true }
    );

    await waitForAudit(
      AuditLogModel,
      {
        action: "application_cvs_bulk_exported",
        company_id: company._id,
        "metadata.files_count": 1,
      },
      "bulk CV export"
    );

    await expectStatus(
      request(baseUrl, "POST", "/company/v1/jobs/hiring/applications/bulk-export", {
        token: tokens.accessToken,
        contextId: companyContext._id,
        body: {
          application_ids: [String(application._id)],
          format: "json",
        },
      }),
      200,
      "applications JSON export"
    );

    const applicationExportAudit = await waitForAudit(
      AuditLogModel,
      {
        action: "applications_exported",
        company_id: company._id,
        "metadata.format": "json",
      },
      "applications export"
    );

    assert.equal(
      applicationExportAudit.metadata?.applications_count,
      1,
      "applications export audit should include safe aggregate count"
    );

    const auditActions = await AuditLogModel.distinct("action", { company_id: company._id });
    for (const expectedAction of [
      "company_file_downloaded",
      "application_cv_downloaded",
      "application_cvs_bulk_exported",
      "applications_exported",
    ]) {
      assert.ok(auditActions.includes(expectedAction), `${expectedAction} should be audited`);
    }

    console.log("File/export audit integration verified for company downloads and exports.");
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    await mongoose.disconnect();
    await mongo.stop();
    await fs.unlink(cvPath).catch(() => {});
    await fs.unlink(companyFilePath).catch(() => {});
  }
}

main().catch(async (error) => {
  console.error(error);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
