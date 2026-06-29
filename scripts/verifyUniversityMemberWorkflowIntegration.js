import assert from "node:assert/strict";
import mongoose from "mongoose";
import { IntegrationMongoServer as MongoMemoryServer } from "./utils/integrationMongo.js";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET ||= "university-member-workflow-integration-secret";
process.env.ACCESS_TOKEN_EXPIRATION_MINUTES ||= "30";
process.env.REFRESH_TOKEN_EXPIRATION_DAYS ||= "30";
process.env.HEALTH_SECRET ||= "university-member-workflow-health-secret";

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

async function main() {
  mongo = await MongoMemoryServer.create({
    instance: {
      dbName: `halajob-university-member-workflow-${nowToken()}`,
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
    RoleModel,
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
    name: `university-member-employee-${suffix}`,
    role_number: 991001,
    title_ar: "Employee",
    title_en: "Employee",
    status: true,
    is_system: true,
  });

  const [ownerA, ownerB, targetMemberUser, addedByMemberUser, outsiderUser] = await UserModel.create([
    userSeed({
      firstName: "University",
      lastName: "OwnerA",
      email: `university.owner.a.${suffix}@alpha.edu`,
      roleId: employeeRole._id,
      phone: `${phoneSeed}01`,
    }),
    userSeed({
      firstName: "University",
      lastName: "OwnerB",
      email: `university.owner.b.${suffix}@beta.edu`,
      roleId: employeeRole._id,
      phone: `${phoneSeed}02`,
    }),
    userSeed({
      firstName: "University",
      lastName: "Target",
      email: `university.target.${suffix}@example.com`,
      roleId: employeeRole._id,
      phone: `${phoneSeed}03`,
    }),
    userSeed({
      firstName: "University",
      lastName: "AddedByMember",
      email: `university.added.${suffix}@example.com`,
      roleId: employeeRole._id,
      phone: `${phoneSeed}04`,
    }),
    userSeed({
      firstName: "University",
      lastName: "Outsider",
      email: `university.outsider.${suffix}@example.com`,
      roleId: employeeRole._id,
      phone: `${phoneSeed}05`,
    }),
  ]);

  const [universityA, universityB] = await UniversityModel.create([
    {
      name: `University Member Alpha ${suffix}`,
      name_en: `University Member Alpha ${suffix}`,
      email_domain: `member-alpha-${suffix}.edu`,
      career_center_email: ownerA.email,
      verified: true,
      status: "active",
      city: "Alpha City",
      country: "United States",
    },
    {
      name: `University Member Beta ${suffix}`,
      name_en: `University Member Beta ${suffix}`,
      email_domain: `member-beta-${suffix}.edu`,
      career_center_email: ownerB.email,
      verified: true,
      status: "active",
      city: "Beta City",
      country: "United States",
    },
  ]);

  await UniversityMembershipModel.create([
    {
      university_id: universityA._id,
      user_id: ownerA._id,
      role: "owner",
      permissions: [],
      status: "active",
      accepted_at: new Date(),
    },
    {
      university_id: universityB._id,
      user_id: ownerB._id,
      role: "owner",
      permissions: [],
      status: "active",
      accepted_at: new Date(),
    },
  ]);

  await Promise.all([syncAccountContextsForUser(ownerA._id), syncAccountContextsForUser(ownerB._id)]);
  const [ownerContextA, ownerContextB] = await Promise.all([
    AccountContextModel.findOne({ user_id: ownerA._id, context_type: "university_admin", entity_id: universityA._id }).lean(),
    AccountContextModel.findOne({ user_id: ownerB._id, context_type: "university_admin", entity_id: universityB._id }).lean(),
  ]);
  assert.ok(ownerContextA?.permissions?.includes("*"), "owner A context should receive wildcard university permissions");
  assert.ok(ownerContextB?.permissions?.includes("*"), "owner B context should receive wildcard university permissions");

  const device = { brand: "University Member Workflow", model_name: "Integration", is_device: false };
  const [ownerATokens, ownerBTokens, targetTokens, outsiderTokens] = await Promise.all([
    generateAuthTokens(ownerA, device),
    generateAuthTokens(ownerB, device),
    generateAuthTokens(targetMemberUser, device),
    generateAuthTokens(outsiderUser, device),
  ]);

  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  await expectStatus(
    request(baseUrl, "GET", "/university/v1/members", {
      token: outsiderTokens.accessToken,
    }),
    403,
    "user without university context should be denied member list"
  );

  const created = await expectStatus(
    request(baseUrl, "POST", "/university/v1/members", {
      token: ownerATokens.accessToken,
      contextId: ownerContextA._id,
      body: {
        user_id: targetMemberUser._id,
        role: "viewer",
      },
    }),
    201,
    "owner should create a viewer university member"
  );
  const memberId = created.data?._id;
  assert.ok(mongoose.Types.ObjectId.isValid(String(memberId)), "created membership id should be returned");

  const viewerContext = await AccountContextModel.findOne({
    user_id: targetMemberUser._id,
    context_type: "university_admin",
    entity_id: universityA._id,
  }).lean();
  assert.equal(viewerContext?.status, "active", "viewer university context should be active");
  assert.deepEqual(
    viewerContext?.permissions,
    ["campus.dashboard.view", "campus.students.view"],
    "viewer context should use role default permissions"
  );

  await expectStatus(
    request(baseUrl, "GET", "/university/v1/members", {
      token: targetTokens.accessToken,
      contextId: viewerContext._id,
    }),
    403,
    "viewer without campus.members.view should not list members"
  );

  await expectStatus(
    request(baseUrl, "PATCH", `/university/v1/members/${memberId}`, {
      token: ownerBTokens.accessToken,
      contextId: ownerContextB._id,
      body: { role: "admin" },
    }),
    404,
    "other university owner should not update university A member"
  );

  await expectStatus(
    request(baseUrl, "PATCH", `/university/v1/members/${memberId}`, {
      token: ownerATokens.accessToken,
      contextId: ownerContextA._id,
      body: { role: "admin" },
    }),
    200,
    "owner should promote viewer to admin"
  );

  const adminContext = await AccountContextModel.findById(viewerContext._id).lean();
  assert.equal(adminContext?.status, "active", "admin context should remain active after promotion");
  assert.ok(adminContext?.permissions?.includes("campus.members.manage"), "promoted admin context should manage members");

  const memberList = await expectStatus(
    request(baseUrl, "GET", "/university/v1/members", {
      token: targetTokens.accessToken,
      contextId: adminContext._id,
    }),
    200,
    "promoted admin should list university members"
  );
  assert.ok(memberList.data.some((item) => String(item._id) === String(memberId)), "member list should include promoted admin");

  const campusAliasCreate = await expectStatus(
    request(baseUrl, "POST", "/campus/v1/admin/members", {
      token: targetTokens.accessToken,
      contextId: adminContext._id,
      body: {
        user_id: addedByMemberUser._id,
        role: "advisor",
      },
    }),
    201,
    "promoted admin should create member through campus admin alias"
  );
  assert.ok(campusAliasCreate.data?._id, "campus alias should return created membership");

  const memberManagedContext = await AccountContextModel.findOne({
    user_id: addedByMemberUser._id,
    context_type: "university_admin",
    entity_id: universityA._id,
  }).lean();
  assert.equal(memberManagedContext?.status, "active", "member-managed invite should create active university context");

  await expectStatus(
    request(baseUrl, "DELETE", `/university/v1/members/${ownerContextA.metadata.membership_id}`, {
      token: ownerATokens.accessToken,
      contextId: ownerContextA._id,
    }),
    422,
    "last active university owner should not be removable"
  );

  await expectStatus(
    request(baseUrl, "DELETE", `/university/v1/members/${memberId}`, {
      token: ownerATokens.accessToken,
      contextId: ownerContextA._id,
    }),
    200,
    "owner should remove the target member"
  );

  const removedContext = await AccountContextModel.findById(adminContext._id).lean();
  assert.equal(removedContext?.status, "removed", "removed membership context should be removed");

  await expectStatus(
    request(baseUrl, "GET", "/university/v1/members", {
      token: targetTokens.accessToken,
      contextId: adminContext._id,
    }),
    403,
    "removed university context should stop working"
  );

  const removedMembership = await UniversityMembershipModel.findById(memberId).lean();
  assert.equal(removedMembership?.status, "removed", "removed university membership row should be marked removed");

  const auditRows = await AuditLogModel.find({
    entity_type: "other",
    action: { $in: ["university_member_upserted", "university_member_updated", "university_member_removed"] },
  }).lean();
  const auditActions = auditRows.map((row) => row.action);
  assert.ok(auditActions.includes("university_member_upserted"), "audit should include university member upsert");
  assert.ok(auditActions.includes("university_member_updated"), "audit should include university member update");
  assert.ok(auditActions.includes("university_member_removed"), "audit should include university member removal");
  assert.ok(
    auditRows.some((row) => row.action === "university_member_upserted" && row.actor_type === "university_admin"),
    "member-managed upsert should be audited as university_admin actor"
  );

  console.log("University member workflow integration verified for CRUD, context sync, permissions, cross-university denial, aliases, owner protection, and audit logs.");
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
