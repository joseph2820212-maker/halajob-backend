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

async function multipartRequest(baseUrl, pathName, { token, contextId, form }) {
  const headers = {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };
  if (contextId) headers["X-Active-Context-Id"] = String(contextId);

  return fetch(`${baseUrl}${pathName}`, {
    method: "POST",
    headers,
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

async function expectStatus(responsePromise, expected, label, { binary = false } = {}) {
  const response = await responsePromise;
  let responseBody = "";
  if (binary && response.status === expected) {
    await response.arrayBuffer();
  } else {
    responseBody = await response.text();
  }
  assert.equal(
    response.status,
    expected,
    `${label} should return ${expected}; got ${response.status}; body=${responseBody}`
  );
  return response;
}

async function expectErrorMessage(responsePromise, expected, messagePattern, label) {
  const response = await responsePromise;
  const payload = await readJson(response);
  assert.equal(
    response.status,
    expected,
    `${label} should return ${expected}; got ${response.status}; body=${JSON.stringify(payload)}`
  );
  assert.match(
    String(payload.message || payload.error || ""),
    messagePattern,
    `${label} should include ${messagePattern} in its error message`
  );
  return payload;
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

  const [companyUser, seekerUser, otherCompanyUser] = await UserModel.create([
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
    {
      first_name: "Other",
      last_name: "Company",
      email: `file.other.company.${suffix}@example.com`,
      gender: "female",
      role_id: companyRole._id,
      password: "not-used",
      status: true,
      phone: `+1555${phoneSeed}03`,
      phone_e164: `+1555${phoneSeed}03`,
      phone_country: "US",
      phone_code: "+1",
      phone_national: `555${phoneSeed}03`,
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

  await CompanyModel.create({
    company_name: `Other File Audit Company ${suffix}`,
    company_email: `file.audit.other.${suffix}@company.example.com`,
    owner_user_id: otherCompanyUser._id,
    role_id: companyRole._id,
    status: true,
    accepted: true,
    is_verified: true,
    can_upload: true,
    files: [],
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

  const [tokens, otherCompanyTokens] = await Promise.all([
    generateAuthTokens(companyUser, {
      brand: "File Audit Browser",
      model_name: "Integration",
      is_device: false,
    }),
    generateAuthTokens(otherCompanyUser, {
      brand: "File Audit Other Browser",
      model_name: "Integration",
      is_device: false,
    }),
  ]);

  const server = app.listen(0);

  try {
    await new Promise((resolve) => server.once("listening", resolve));
    const { port } = server.address();
    const baseUrl = `http://127.0.0.1:${port}`;

    const invalidCompanyFileForm = new FormData();
    invalidCompanyFileForm.append("file", new Blob([Buffer.from("<html>not a pdf</html>")], { type: "text/html" }), "company-proof.pdf");
    await expectErrorMessage(
      multipartRequest(baseUrl, "/user/v1/company/upload-file", {
        token: tokens.accessToken,
        form: invalidCompanyFileForm,
      }),
      400,
      /unsupported_file_type/,
      "company request file upload rejects MIME mismatch"
    );

    const oversizedCompanyFileForm = new FormData();
    oversizedCompanyFileForm.append("file", new Blob([Buffer.alloc(4 * 1024 * 1024 + 1, 67)], { type: "application/pdf" }), "too-large-company-proof.pdf");
    await expectErrorMessage(
      multipartRequest(baseUrl, "/user/v1/company/upload-file", {
        token: tokens.accessToken,
        form: oversizedCompanyFileForm,
      }),
      413,
      /file_too_large/,
      "company request file upload rejects oversize file"
    );

    const companyAfterRejectedUploads = await CompanyModel.findById(company._id).lean();
    assert.deepEqual(
      companyAfterRejectedUploads.files,
      [companyFileName],
      "rejected company file uploads should not mutate company files"
    );

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

    await expectStatus(
      request(baseUrl, "GET", `/user/v1/company/download-file?filename=${encodeURIComponent(companyFileName)}`, {
        token: tokens.accessToken,
      }),
      200,
      "app company request file download",
      { binary: true }
    );

    await waitForAudit(
      AuditLogModel,
      {
        action: "company_request_file_downloaded",
        company_id: company._id,
        entity_id: company._id,
        "metadata.filename": companyFileName,
        "metadata.source": "app_company_request",
      },
      "app company request file download"
    );

    const appTraversalResponse = await request(
      baseUrl,
      "GET",
      "/user/v1/company/download-file?filename=%2e%2e%2fsecret.pdf",
      {
        token: tokens.accessToken,
      }
    );
    await appTraversalResponse.text();
    assert.ok(
      [400, 404].includes(appTraversalResponse.status),
      `app company file traversal should fail safely; got ${appTraversalResponse.status}`
    );

    await expectStatus(
      request(baseUrl, "GET", `/user/v1/company/download-file?filename=${encodeURIComponent(companyFileName)}`, {
        token: otherCompanyTokens.accessToken,
      }),
      404,
      "other company app file download"
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

    const exportAuditCountBeforeRejectedRequests = await AuditLogModel.countDocuments({
      company_id: company._id,
      action: { $in: ["application_cvs_bulk_exported", "applications_exported"] },
    });

    await expectErrorMessage(
      request(baseUrl, "POST", "/company/v1/jobs/hiring/applications/bulk-cv", {
        token: tokens.accessToken,
        contextId: companyContext._id,
        body: {
          application_ids: [String(application._id), "not-an-application-id"],
        },
      }),
      400,
      /invalid_application_ids/,
      "bulk application CV export rejects invalid explicit application IDs"
    );

    await expectErrorMessage(
      request(baseUrl, "POST", "/company/v1/jobs/hiring/applications/bulk-export", {
        token: tokens.accessToken,
        contextId: companyContext._id,
        body: {
          application_ids: [String(application._id), "not-an-application-id"],
          format: "json",
        },
      }),
      400,
      /invalid_application_ids/,
      "applications export rejects invalid explicit application IDs"
    );

    await expectErrorMessage(
      request(baseUrl, "POST", "/company/v1/jobs/hiring/applications/bulk-export", {
        token: tokens.accessToken,
        contextId: companyContext._id,
        body: {
          application_ids: [String(application._id)],
          format: "csv",
        },
      }),
      400,
      /invalid_export_format/,
      "applications export rejects unsupported formats"
    );

    assert.equal(
      await AuditLogModel.countDocuments({
        company_id: company._id,
        action: { $in: ["application_cvs_bulk_exported", "applications_exported"] },
      }),
      exportAuditCountBeforeRejectedRequests,
      "rejected export requests should not write successful export audit rows"
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
      "company_request_file_downloaded",
      "application_cv_downloaded",
      "application_cvs_bulk_exported",
      "applications_exported",
    ]) {
      assert.ok(auditActions.includes(expectedAction), `${expectedAction} should be audited`);
    }

    console.log("File/export audit integration verified for company upload MIME/size rejection, downloads, and exports.");
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
