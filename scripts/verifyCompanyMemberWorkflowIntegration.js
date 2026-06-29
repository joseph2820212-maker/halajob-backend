import assert from "node:assert/strict";
import mongoose from "mongoose";
import { IntegrationMongoServer as MongoMemoryServer } from "./utils/integrationMongo.js";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET ||= "company-member-workflow-integration-secret";
process.env.ACCESS_TOKEN_EXPIRATION_MINUTES ||= "30";
process.env.REFRESH_TOKEN_EXPIRATION_DAYS ||= "30";
process.env.HEALTH_SECRET ||= "company-member-workflow-health-secret";

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
      dbName: `halajob-company-member-workflow-${nowToken()}`,
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

  const [companyRole, employeeRole] = await RoleModel.create([
    {
      log_to: "company",
      name: `member-workflow-company-${suffix}`,
      role_number: 3,
      title_ar: "Company",
      title_en: "Company",
      status: true,
      is_system: true,
    },
    {
      log_to: "employee",
      name: `member-workflow-employee-${suffix}`,
      role_number: 4,
      title_ar: "Employee",
      title_en: "Employee",
      status: true,
      is_system: true,
    },
  ]);

  const [ownerA, ownerB, targetMemberUser, addedByMemberUser] = await UserModel.create([
    userSeed({
      firstName: "Member",
      lastName: "OwnerA",
      email: `member.owner.a.${suffix}@example.com`,
      roleId: companyRole._id,
      phone: `${phoneSeed}01`,
    }),
    userSeed({
      firstName: "Member",
      lastName: "OwnerB",
      email: `member.owner.b.${suffix}@example.com`,
      roleId: companyRole._id,
      phone: `${phoneSeed}02`,
    }),
    userSeed({
      firstName: "Member",
      lastName: "Target",
      email: `member.target.${suffix}@example.com`,
      roleId: employeeRole._id,
      phone: `${phoneSeed}03`,
    }),
    userSeed({
      firstName: "Member",
      lastName: "AddedByMember",
      email: `member.added.${suffix}@example.com`,
      roleId: employeeRole._id,
      phone: `${phoneSeed}04`,
    }),
  ]);

  const [companyA, companyB] = await CompanyModel.create([
    {
      company_name: `Member Alpha ${suffix}`,
      company_email: `member-alpha-${suffix}@company.example.com`,
      owner_user_id: ownerA._id,
      role_id: companyRole._id,
      status: true,
      accepted: true,
      can_upload: true,
      is_verified: true,
      profile_completion: 90,
    },
    {
      company_name: `Member Beta ${suffix}`,
      company_email: `member-beta-${suffix}@company.example.com`,
      owner_user_id: ownerB._id,
      role_id: companyRole._id,
      status: true,
      accepted: true,
      can_upload: true,
      is_verified: true,
      profile_completion: 90,
    },
  ]);

  const [ownerContextA, ownerContextB] = await AccountContextModel.create([
    {
      user_id: ownerA._id,
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
      user_id: ownerB._id,
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
    UserModel.updateOne({ _id: ownerA._id }, { $set: { default_context_id: ownerContextA._id } }),
    UserModel.updateOne({ _id: ownerB._id }, { $set: { default_context_id: ownerContextB._id } }),
  ]);

  const device = { brand: "Company Member Workflow", model_name: "Integration", is_device: false };
  const [ownerATokens, ownerBTokens, targetTokens] = await Promise.all([
    generateAuthTokens(ownerA, device),
    generateAuthTokens(ownerB, device),
    generateAuthTokens(targetMemberUser, device),
  ]);

  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  await expectStatus(
    request(baseUrl, "GET", "/company/v1/global/applications", {
      token: targetTokens.accessToken,
    }),
    403,
    "target user without company context should be denied company APIs"
  );

  await expectStatus(
    request(baseUrl, "POST", "/company/v1/global/members", {
      token: ownerATokens.accessToken,
      contextId: ownerContextA._id,
      body: {
        user_id: ownerA._id,
        member_role: "admin",
      },
    }),
    422,
    "company owner cannot be added as a member of their own company"
  );

  const created = await expectStatus(
    request(baseUrl, "POST", "/company/v1/global/members", {
      token: ownerATokens.accessToken,
      contextId: ownerContextA._id,
      body: {
        user_id: targetMemberUser._id,
        member_role: "viewer",
        permissions: ["ats.view"],
      },
    }),
    201,
    "owner should create a viewer member"
  );
  const memberId = created.data?._id;
  assert.ok(mongoose.Types.ObjectId.isValid(String(memberId)), "created member id should be returned");

  const viewerContext = await AccountContextModel.findOne({
    user_id: targetMemberUser._id,
    context_type: "company_member",
    entity_id: companyA._id,
  }).lean();
  assert.equal(viewerContext?.status, "active", "viewer member context should be active");
  assert.deepEqual(viewerContext?.permissions, ["ats.view"], "viewer context should mirror member permissions");
  assert.equal(String(viewerContext?.metadata?.member_id), String(memberId), "context should reference member id");

  await expectStatus(
    request(baseUrl, "GET", "/company/v1/global/applications", {
      token: targetTokens.accessToken,
      contextId: viewerContext._id,
    }),
    200,
    "viewer member should access ATS read route"
  );

  await expectStatus(
    request(baseUrl, "POST", "/company/v1/global/members", {
      token: targetTokens.accessToken,
      contextId: viewerContext._id,
      body: {
        user_id: addedByMemberUser._id,
        member_role: "viewer",
      },
    }),
    403,
    "viewer member without company.members.manage should not manage members"
  );

  await expectStatus(
    request(baseUrl, "PATCH", `/company/v1/global/members/${memberId}`, {
      token: ownerBTokens.accessToken,
      contextId: ownerContextB._id,
      body: { member_role: "admin" },
    }),
    404,
    "other company owner should not update company A member"
  );

  await expectStatus(
    request(baseUrl, "PATCH", `/company/v1/global/members/${memberId}`, {
      token: ownerATokens.accessToken,
      contextId: ownerContextA._id,
      body: {
        member_role: "admin",
        permissions: ["company.members.manage", "ats.view"],
      },
    }),
    200,
    "owner should promote member to admin"
  );

  const removedViewerContext = await AccountContextModel.findById(viewerContext._id).lean();
  assert.equal(removedViewerContext?.status, "removed", "old company_member context should be removed after admin promotion");

  const adminContext = await AccountContextModel.findOne({
    user_id: targetMemberUser._id,
    context_type: "company_admin",
    entity_id: companyA._id,
  }).lean();
  assert.equal(adminContext?.status, "active", "admin member context should be active");
  assert.deepEqual(
    adminContext?.permissions,
    ["company.members.manage", "ats.view"],
    "admin context should mirror promoted member permissions"
  );

  await expectStatus(
    request(baseUrl, "GET", "/company/v1/global/applications", {
      token: targetTokens.accessToken,
      contextId: viewerContext._id,
    }),
    403,
    "old removed member context should stop working"
  );

  await expectStatus(
    request(baseUrl, "POST", "/company/v1/global/members", {
      token: targetTokens.accessToken,
      contextId: adminContext._id,
      body: {
        user_id: addedByMemberUser._id,
        member_role: "viewer",
        permissions: ["ats.view"],
      },
    }),
    201,
    "promoted admin member should manage members"
  );

  const memberManagedRow = await CompanyMemberModel.findOne({
    company_id: companyA._id,
    user_id: addedByMemberUser._id,
  }).lean();
  assert.equal(memberManagedRow?.status, "active", "member-managed invite should create active member row");

  const memberManagedContext = await AccountContextModel.findOne({
    user_id: addedByMemberUser._id,
    context_type: "company_member",
    entity_id: companyA._id,
  }).lean();
  assert.equal(memberManagedContext?.status, "active", "member-managed invite should create active context");

  await expectStatus(
    request(baseUrl, "DELETE", `/company/v1/global/members/${memberId}`, {
      token: ownerATokens.accessToken,
      contextId: ownerContextA._id,
    }),
    200,
    "owner should remove member"
  );

  const removedAdminContext = await AccountContextModel.findById(adminContext._id).lean();
  assert.equal(removedAdminContext?.status, "removed", "admin context should be removed after member removal");

  await expectStatus(
    request(baseUrl, "GET", "/company/v1/global/applications", {
      token: targetTokens.accessToken,
      contextId: adminContext._id,
    }),
    403,
    "removed admin member context should stop working"
  );

  const removedMember = await CompanyMemberModel.findById(memberId).lean();
  assert.equal(removedMember?.status, "removed", "removed member row should be marked removed");

  const auditRows = await AuditLogModel.find({ company_id: companyA._id, entity_type: "company_member" }).lean();
  const auditActions = auditRows.map((row) => row.action);
  assert.ok(auditActions.includes("company_member_upserted"), "audit should include member upsert");
  assert.ok(auditActions.includes("company_member_updated"), "audit should include member update");
  assert.ok(auditActions.includes("company_member_removed"), "audit should include member removal");
  assert.ok(
    auditRows.some((row) => row.action === "company_member_upserted" && row.actor_type === "company_member"),
    "member-managed upsert should be audited as company_member actor"
  );

  console.log("Company member workflow integration verified for CRUD, context sync, permission boundaries, cross-company denial, and audit logs.");
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
