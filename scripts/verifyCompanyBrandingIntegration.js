import assert from "node:assert/strict";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET ||= "company-branding-integration-secret";
process.env.ACCESS_TOKEN_EXPIRATION_MINUTES ||= "30";
process.env.REFRESH_TOKEN_EXPIRATION_DAYS ||= "30";
process.env.HEALTH_SECRET ||= "company-branding-health-secret";

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
    phone: `+1557${phone}`,
    phone_e164: `+1557${phone}`,
    phone_country: "US",
    phone_code: "+1",
    phone_national: `557${phone}`,
  };
}

function jobSeed({ company, companyUser, countryId, suffix }) {
  return {
    job_name: `Public Branding Role ${suffix}`,
    ref: `BRAND-${suffix.slice(-10)}`,
    description: "Public company branding integration role with enough content for public job listing verification.",
    status: true,
    is_accepted: true,
    publish_status: "published",
    started_date: new Date(Date.now() - 24 * 60 * 60 * 1000),
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    apply_deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
    countries: [String(countryId)],
    city: "Damascus",
    work_mode_id: objectId(),
    work_mode_info: { key: "onsite", title_en: "On site" },
    is_remote: false,
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
      min: 500000,
      max: 900000,
    },
    company_id: company._id,
    user_id: companyUser._id,
    skills_required: [{ title: "Public branding", level: 3 }],
    languages: [{ name: "Arabic", level: 5, level_text: "fluent" }],
    is_cv_required: true,
  };
}

async function main() {
  mongo = await MongoMemoryServer.create({
    instance: { dbName: `halajob-company-branding-${nowToken()}` },
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
    RoleModel,
    UserModel,
    jobsModel,
  } = models;
  const { generateAuthTokens } = tokenService;

  await mongoose.connect(process.env.CONNECTION_URL, { serverSelectionTimeoutMS: 10000 });

  const suffix = nowToken();
  const phoneSeed = suffix.slice(-8);
  const countryId = objectId();

  const [adminRole, companyRole] = await RoleModel.create([
    {
      log_to: "dash",
      name: `company-branding-super-admin-${suffix}`,
      role_number: 1,
      title_ar: "Super Admin",
      title_en: "Super Admin",
      permissions: [],
      status: true,
      is_system: true,
    },
    {
      log_to: "company",
      name: `company-branding-company-${suffix}`,
      role_number: 993002,
      title_ar: "Company",
      title_en: "Company",
      status: true,
      is_system: true,
    },
  ]);

  const [adminUser, companyUser] = await UserModel.create([
    userSeed({ firstName: "Brand", lastName: "Admin", email: `brand.admin.${suffix}@example.com`, roleId: adminRole._id, phone: `${phoneSeed}01` }),
    userSeed({ firstName: "Brand", lastName: "Company", email: `brand.company.${suffix}@example.com`, roleId: companyRole._id, phone: `${phoneSeed}02` }),
  ]);

  const company = await CompanyModel.create({
    company_name: `Branding Alpha ${suffix}`,
    slug: `branding-alpha-${suffix.toLowerCase()}`,
    company_email: `branding-alpha-${suffix}@company.example.com`,
    owner_user_id: companyUser._id,
    role_id: companyRole._id,
    status: true,
    accepted: true,
    can_upload: true,
    is_verified: true,
    verified_at: new Date(),
    profile_completion: 90,
    company_short_description: "A draft public profile that should not be visible before approval.",
    description: "A private draft description for public branding integration.",
    company_country: "Syria",
    company_city: "Damascus",
    company_address: "Private office address",
    company_website: "https://branding-alpha.example.com",
    hr_email: `private.hr.${suffix}@company.example.com`,
    hr_phone: "+155700000",
    company_phone: "+155711111",
    files: ["private-license.pdf"],
    verification_documents: [{ type: "license", file: "private-license.pdf", status: "pending", note: "private" }],
    benefits: ["Health support", "Flexible schedule"],
    specialties: ["Recruiting", "Training"],
    public_profile: { status: "draft" },
  });

  await jobsModel.create(jobSeed({ company, companyUser, countryId, suffix }));

  const contextCompany = await AccountContextModel.create({
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
  await UserModel.updateOne({ _id: companyUser._id }, { $set: { default_context_id: contextCompany._id } });

  const device = { brand: "Company Branding", model_name: "Integration", is_device: false };
  const [adminTokens, companyTokens] = await Promise.all([
    generateAuthTokens(adminUser, device),
    generateAuthTokens(companyUser, device),
  ]);

  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  await expectStatus(
    request(baseUrl, "GET", `/public/v1/companies/${company.slug}`),
    404,
    "public should not see draft company profile"
  );

  const draft = await expectStatus(
    request(baseUrl, "PATCH", "/company/v1/profile/public", {
      token: companyTokens.accessToken,
      contextId: contextCompany._id,
      body: {
        seo_title: "Branding Alpha careers",
        seo_description: "Work with a verified Syrian employer.",
        why_work_with_us: "Trusted local employer with clear hiring communication.",
        hiring_process: "Apply, phone screen, interview, offer.",
        benefits: ["Training budget", "Paid leave"],
        specialties: ["Syria hiring", "Campus recruiting"],
      },
    }),
    200,
    "company should update public profile draft"
  );
  assert.equal(draft.data?.public_profile?.status, "draft", "updated profile should remain draft");

  const submitted = await expectStatus(
    request(baseUrl, "POST", "/company/v1/profile/public/submit-review", {
      token: companyTokens.accessToken,
      contextId: contextCompany._id,
    }),
    200,
    "company should submit public profile for review"
  );
  assert.equal(submitted.data?.public_profile?.status, "pending_review", "submit should mark profile pending review");

  const pending = await expectStatus(
    request(baseUrl, "GET", "/dash/v1/company-public-profiles/pending", {
      token: adminTokens.accessToken,
    }),
    200,
    "admin should list pending public profiles"
  );
  assert.ok(pending.data?.some((item) => String(item._id) === String(company._id)), "pending queue should include submitted company");

  const approved = await expectStatus(
    request(baseUrl, "POST", `/dash/v1/company-public-profiles/${company._id}/approve`, {
      token: adminTokens.accessToken,
    }),
    200,
    "admin should approve public profile"
  );
  assert.equal(approved.data?.public_profile?.status, "published", "approve should publish profile");

  const publicProfile = await expectStatus(
    request(baseUrl, "GET", `/public/v1/companies/${company.slug}`),
    200,
    "public should see approved company profile"
  );
  assert.equal(publicProfile.data?.company?.company_name, company.company_name, "public payload should include company name");
  assert.equal(publicProfile.data?.company?.public_profile?.why_work_with_us, "Trusted local employer with clear hiring communication.", "public profile copy should be visible");
  assert.ok(publicProfile.data?.open_jobs?.length >= 1, "public company page should include open jobs");

  const publicString = JSON.stringify(publicProfile.data);
  assert.ok(!publicString.includes("owner_user_id"), "public response must not expose owner_user_id");
  assert.ok(!publicString.includes("private.hr"), "public response must not expose private HR email");
  assert.ok(!publicString.includes("subscription"), "public response must not expose subscription fields");
  assert.ok(!publicString.includes("verification_documents"), "public response must not expose verification documents");
  assert.ok(!publicString.includes("private-license.pdf"), "public response must not expose private uploaded files");

  const legacyPublicProfile = await expectStatus(
    request(baseUrl, "GET", `/user/v1/company/public/${company._id}`),
    200,
    "legacy public company endpoint should stay compatible"
  );
  assert.equal(legacyPublicProfile.data?.company?.company_name, company.company_name, "legacy public endpoint should include company name");
  const legacyPublicString = JSON.stringify(legacyPublicProfile.data);
  assert.ok(!legacyPublicString.includes("owner_user_id"), "legacy public endpoint must not expose owner_user_id");
  assert.ok(!legacyPublicString.includes("private.hr"), "legacy public endpoint must not expose private HR email");
  assert.ok(!legacyPublicString.includes("subscription"), "legacy public endpoint must not expose subscription fields");
  assert.ok(!legacyPublicString.includes("verification_documents"), "legacy public endpoint must not expose verification documents");
  assert.ok(!legacyPublicString.includes("private-license.pdf"), "legacy public endpoint must not expose private uploaded files");

  await expectStatus(
    request(baseUrl, "PATCH", "/company/v1/profile/public", {
      token: companyTokens.accessToken,
      contextId: contextCompany._id,
      body: { why_work_with_us: "Updated draft after approval." },
    }),
    200,
    "company should move edited published profile back to draft"
  );

  await expectStatus(
    request(baseUrl, "POST", "/company/v1/profile/public/submit-review", {
      token: companyTokens.accessToken,
      contextId: contextCompany._id,
    }),
    200,
    "company should resubmit edited public profile"
  );

  const rejected = await expectStatus(
    request(baseUrl, "POST", `/dash/v1/company-public-profiles/${company._id}/reject`, {
      token: adminTokens.accessToken,
      body: { reason: "Please replace the cover image with a real office photo." },
    }),
    200,
    "admin should reject public profile with reason"
  );
  assert.equal(rejected.data?.public_profile?.status, "rejected", "reject should set rejected status");

  const companyView = await expectStatus(
    request(baseUrl, "GET", "/company/v1/profile/public", {
      token: companyTokens.accessToken,
      contextId: contextCompany._id,
    }),
    200,
    "company should view rejected public profile"
  );
  assert.equal(companyView.data?.public_profile?.rejection_reason, "Please replace the cover image with a real office photo.", "company should see rejection reason");

  await expectStatus(
    request(baseUrl, "GET", `/public/v1/companies/${company.slug}`),
    404,
    "public should not see rejected company profile"
  );

  console.log("Company branding integration verified for draft visibility, admin approval/rejection, public safe fields, jobs, and company rejection reason.");
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
