import assert from "node:assert/strict";
import mongoose from "mongoose";
import { IntegrationMongoServer as MongoMemoryServer } from "./utils/integrationMongo.js";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET ||= "company-permission-integration-secret";
process.env.ACCESS_TOKEN_EXPIRATION_MINUTES ||= "30";
process.env.REFRESH_TOKEN_EXPIRATION_DAYS ||= "30";
process.env.HEALTH_SECRET ||= "company-permission-health-secret";

let mongo;
let server;

const nowToken = () => new Date().toISOString().replace(/[-:.TZ]/g, "");

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
      dbName: `halajob-company-permission-${nowToken()}`,
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
    CompanyMemberModel,
    CompanyModel,
    RoleModel,
    UserModel,
  } = models;
  const { generateAuthTokens } = tokenService;

  await mongoose.connect(process.env.CONNECTION_URL, {
    serverSelectionTimeoutMS: 10000,
  });

  const suffix = nowToken();
  const phoneSeed = suffix.slice(-8);

  const companyRole = await RoleModel.create({
    log_to: "company",
    name: `company-permission-role-${suffix}`,
    role_number: 3,
    title_ar: "Company",
    title_en: "Company",
    status: true,
    is_system: true,
  });

  const [ownerUser, memberUser] = await UserModel.create([
    userSeed({
      firstName: "Company",
      lastName: "Owner",
      email: `company.permission.owner.${suffix}@example.com`,
      roleId: companyRole._id,
      phone: `${phoneSeed}01`,
    }),
    userSeed({
      firstName: "Company",
      lastName: "Member",
      email: `company.permission.member.${suffix}@example.com`,
      roleId: companyRole._id,
      phone: `${phoneSeed}02`,
    }),
  ]);

  const company = await CompanyModel.create({
    company_name: `Permission Company ${suffix}`,
    company_email: `permission.${suffix}@company.example.com`,
    owner_user_id: ownerUser._id,
    role_id: companyRole._id,
    status: true,
    accepted: true,
    can_upload: true,
    is_verified: true,
    profile_completion: 70,
  });

  const member = await CompanyMemberModel.create({
    company_id: company._id,
    user_id: memberUser._id,
    member_role: "viewer",
    permissions: ["ats.view"],
    status: "active",
    invited_by: ownerUser._id,
    invited_at: new Date(),
  });

  const [ownerContext, memberContext] = await AccountContextModel.create([
    {
      user_id: ownerUser._id,
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
      user_id: memberUser._id,
      context_key: `company_member:${company._id}:${member._id}`,
      context_type: "company_member",
      entity_id: company._id,
      entity_model: "companies",
      display_name: `${company.company_name} member`,
      status: "active",
      permissions: ["ats.view"],
      is_default: true,
    },
  ]);

  await Promise.all([
    UserModel.updateOne({ _id: ownerUser._id }, { $set: { default_context_id: ownerContext._id } }),
    UserModel.updateOne({ _id: memberUser._id }, { $set: { default_context_id: memberContext._id } }),
  ]);

  const device = { brand: "Company Permission", model_name: "Integration", is_device: false };
  const [ownerTokens, memberTokens] = await Promise.all([
    generateAuthTokens(ownerUser, device),
    generateAuthTokens(memberUser, device),
  ]);

  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  const ownerJobs = await expectStatus(
    request(baseUrl, "GET", "/company/v1/global/jobs", {
      token: ownerTokens.accessToken,
      contextId: ownerContext._id,
    }),
    200,
    "company owner should access jobs.manage route"
  );
  assert.equal(ownerJobs.success, true, "owner jobs response should be successful");

  const memberMissingJobs = await expectStatus(
    request(baseUrl, "GET", "/company/v1/global/jobs", {
      token: memberTokens.accessToken,
      contextId: memberContext._id,
    }),
    403,
    "company member without jobs.manage should be denied"
  );
  assert.equal(memberMissingJobs.message, "company_permission_denied");
  assert.equal(memberMissingJobs.errors?.permission, "jobs.manage");

  const memberApplications = await expectStatus(
    request(baseUrl, "GET", "/company/v1/global/applications", {
      token: memberTokens.accessToken,
      contextId: memberContext._id,
    }),
    200,
    "company member with ats.view should access ATS read route"
  );
  assert.equal(memberApplications.success, true, "member ATS response should be successful");

  const memberMissingBilling = await expectStatus(
    request(baseUrl, "GET", "/company/v1/global/subscription/current", {
      token: memberTokens.accessToken,
      contextId: memberContext._id,
    }),
    403,
    "company member without billing.manage should be denied"
  );
  assert.equal(memberMissingBilling.message, "company_permission_denied");
  assert.equal(memberMissingBilling.errors?.permission, "billing.manage");

  await CompanyMemberModel.updateOne({ _id: member._id }, { $set: { status: "suspended" } });
  await expectStatus(
    request(baseUrl, "GET", "/company/v1/global/applications", {
      token: memberTokens.accessToken,
      contextId: memberContext._id,
    }),
    403,
    "suspended company member record should fail closed"
  );

  console.log("Company permission integration verified for owner wildcard, member allow/deny, and suspended-member denial.");
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
