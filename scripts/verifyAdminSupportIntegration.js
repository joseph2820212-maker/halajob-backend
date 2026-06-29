import assert from "node:assert/strict";
import mongoose from "mongoose";
import { IntegrationMongoServer as MongoMemoryServer } from "./utils/integrationMongo.js";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET ||= "admin-support-integration-secret";
process.env.ACCESS_TOKEN_EXPIRATION_MINUTES ||= "30";
process.env.REFRESH_TOKEN_EXPIRATION_DAYS ||= "30";
process.env.HEALTH_SECRET ||= "admin-support-health-secret";

let mongo;
let server;

const nowToken = () => new Date().toISOString().replace(/[-:.TZ]/g, "");

function authHeaders(token, extra = {}) {
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...extra,
  };
}

async function request(baseUrl, method, pathName, { token, body, headers } = {}) {
  const hasBody = !["GET", "HEAD"].includes(method);
  return fetch(`${baseUrl}${pathName}`, {
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
  assert.equal(
    response.status,
    expected,
    `${label} should return ${expected}; got ${response.status}; body=${JSON.stringify(payload)}`
  );
  return payload;
}

async function createPermission(PermissionModel, key) {
  const [group, action = "manage"] = key.split(".");
  return PermissionModel.create({
    key,
    group,
    action,
    title_ar: key,
    title_en: key,
    status: true,
  });
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
      dbName: `halajob-admin-support-${nowToken()}`,
    },
  });

  process.env.CONNECTION_URL = mongo.getUri();

  const [{ default: app }, models, tokenService] = await Promise.all([
    import("../app.js"),
    import("../models/index.js"),
    import("../services/tokenService.js"),
  ]);

  const {
    AuditLogModel,
    CompanyModel,
    CompanySupportTicketModel,
    PermissionModel,
    RoleModel,
    UserModel,
  } = models;
  const { generateAuthTokens } = tokenService;

  await mongoose.connect(process.env.CONNECTION_URL, {
    serverSelectionTimeoutMS: 10000,
  });

  const suffix = nowToken();
  const phoneSeed = suffix.slice(-8);

  const [supportViewPermission, supportManagePermission] = await Promise.all([
    createPermission(PermissionModel, "support.view"),
    createPermission(PermissionModel, "support.manage"),
  ]);

  const [supportViewRole, supportManageRole, dashNoSupportRole, companyRole, employeeRole] = await RoleModel.create([
    {
      log_to: "dash",
      name: `admin-support-view-${suffix}`,
      role_number: 960001,
      title_ar: "Support Viewer",
      title_en: "Support Viewer",
      permissions: [supportViewPermission._id],
      status: true,
      is_system: false,
    },
    {
      log_to: "dash",
      name: `admin-support-manage-${suffix}`,
      role_number: 960002,
      title_ar: "Support Manager",
      title_en: "Support Manager",
      permissions: [supportManagePermission._id],
      status: true,
      is_system: false,
    },
    {
      log_to: "dash",
      name: `admin-support-nosupport-${suffix}`,
      role_number: 960003,
      title_ar: "No Support",
      title_en: "No Support",
      permissions: [],
      status: true,
      is_system: false,
    },
    {
      log_to: "company",
      name: `admin-support-company-${suffix}`,
      role_number: 960004,
      title_ar: "Company",
      title_en: "Company",
      status: true,
      is_system: true,
    },
    {
      log_to: "employee",
      name: `admin-support-employee-${suffix}`,
      role_number: 960005,
      title_ar: "Employee",
      title_en: "Employee",
      status: true,
      is_system: true,
    },
  ]);

  const [supportViewUser, supportManageUser, dashNoSupportUser, companyUser, seekerUser] = await UserModel.create([
    userSeed({
      firstName: "Support",
      lastName: "Viewer",
      email: `support.viewer.${suffix}@example.com`,
      roleId: supportViewRole._id,
      phone: `${phoneSeed}01`,
    }),
    userSeed({
      firstName: "Support",
      lastName: "Manager",
      email: `support.manager.${suffix}@example.com`,
      roleId: supportManageRole._id,
      phone: `${phoneSeed}02`,
    }),
    userSeed({
      firstName: "Support",
      lastName: "NoAccess",
      email: `support.noaccess.${suffix}@example.com`,
      roleId: dashNoSupportRole._id,
      phone: `${phoneSeed}03`,
    }),
    userSeed({
      firstName: "Company",
      lastName: "Owner",
      email: `support.company.${suffix}@example.com`,
      roleId: companyRole._id,
      phone: `${phoneSeed}04`,
    }),
    userSeed({
      firstName: "Support",
      lastName: "Seeker",
      email: `support.seeker.${suffix}@example.com`,
      roleId: employeeRole._id,
      phone: `${phoneSeed}05`,
    }),
  ]);

  const company = await CompanyModel.create({
    company_name: `Support Company ${suffix}`,
    company_email: `support.${suffix}@company.example.com`,
    owner_user_id: companyUser._id,
    role_id: companyRole._id,
    status: true,
    accepted: true,
    can_upload: true,
    is_verified: true,
    profile_completion: 80,
  });

  const ticket = await CompanySupportTicketModel.create({
    company_id: company._id,
    created_by: companyUser._id,
    type: "bug_report",
    subject: "Dashboard cannot open applicants",
    message: "The applicant list is loading forever.",
    priority: "high",
  });

  const device = { brand: "Admin Support", model_name: "Integration", is_device: false };
  const [supportViewTokens, supportManageTokens, dashNoSupportTokens, seekerTokens] = await Promise.all([
    generateAuthTokens(supportViewUser, device),
    generateAuthTokens(supportManageUser, device),
    generateAuthTokens(dashNoSupportUser, device),
    generateAuthTokens(seekerUser, device),
  ]);

  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  await expectStatus(
    request(baseUrl, "GET", "/dash/v1/support-tickets"),
    401,
    "missing token should not list admin support tickets"
  );

  await expectStatus(
    request(baseUrl, "GET", "/dash/v1/support-tickets", { token: seekerTokens.accessToken }),
    403,
    "non-dashboard user should not list admin support tickets"
  );

  const noSupport = await expectStatus(
    request(baseUrl, "GET", "/dash/v1/support-tickets", { token: dashNoSupportTokens.accessToken }),
    403,
    "dashboard user without support.view should be denied"
  );
  assert.equal(noSupport.requiredPermission, "support.view");

  const listPayload = await expectStatus(
    request(baseUrl, "GET", `/dash/v1/support-tickets?status=open&q=${ticket.ticket_no}`, {
      token: supportViewTokens.accessToken,
    }),
    200,
    "support.view admin should list support tickets"
  );
  assert.equal(listPayload.status, true);
  assert.ok((listPayload.data || []).some((item) => String(item._id) === String(ticket._id)), "support list should include seeded ticket");

  const detailPayload = await expectStatus(
    request(baseUrl, "GET", `/dash/v1/operations/support-tickets/${ticket._id}`, {
      token: supportViewTokens.accessToken,
    }),
    200,
    "support.view admin should read support ticket details through operations alias"
  );
  assert.equal(detailPayload.data.subject, ticket.subject);

  const managerListPayload = await expectStatus(
    request(baseUrl, "GET", `/dash/v1/operations/support-tickets?status=open&q=${ticket.ticket_no}`, {
      token: supportManageTokens.accessToken,
    }),
    200,
    "support.manage admin should list support tickets"
  );
  assert.ok(
    (managerListPayload.data || []).some((item) => String(item._id) === String(ticket._id)),
    "support.manage list should include seeded ticket"
  );

  const managerDetailPayload = await expectStatus(
    request(baseUrl, "GET", `/dash/v1/support-tickets/${ticket._id}`, {
      token: supportManageTokens.accessToken,
    }),
    200,
    "support.manage admin should read support ticket details"
  );
  assert.equal(managerDetailPayload.data.subject, ticket.subject);

  const viewCannotUpdate = await expectStatus(
    request(baseUrl, "PATCH", `/dash/v1/support-tickets/${ticket._id}/status`, {
      token: supportViewTokens.accessToken,
      body: { status: "in_progress" },
    }),
    403,
    "support.view admin should not update support ticket status"
  );
  assert.equal(viewCannotUpdate.requiredPermission, "support.manage");

  const invalidStatus = await expectStatus(
    request(baseUrl, "PATCH", `/dash/v1/support-tickets/${ticket._id}/status`, {
      token: supportManageTokens.accessToken,
      body: { status: "waiting" },
    }),
    422,
    "support.manage admin should get validation for invalid support ticket status"
  );
  assert.equal(invalidStatus.message, "invalid_support_ticket_status");

  const statusPayload = await expectStatus(
    request(baseUrl, "PATCH", `/dash/v1/support-tickets/${ticket._id}/status`, {
      token: supportManageTokens.accessToken,
      body: {
        status: "in_progress",
        priority: "urgent",
        assigned_to: supportManageUser._id,
        admin_note: "Investigating applicant queue issue.",
      },
    }),
    200,
    "support.manage admin should update support ticket status"
  );
  assert.equal(statusPayload.data.status, "in_progress");
  assert.equal(statusPayload.data.priority, "urgent");
  assert.equal(String(statusPayload.data.assigned_to?._id || statusPayload.data.assigned_to), String(supportManageUser._id));

  const messagePayload = await expectStatus(
    request(baseUrl, "POST", `/dash/v1/operations/support-tickets/${ticket._id}/messages`, {
      token: supportManageTokens.accessToken,
      body: { message: "We are checking this with the hiring pipeline logs." },
    }),
    200,
    "support.manage admin should add support ticket replies"
  );
  assert.equal(messagePayload.data.status, "answered");
  assert.ok(
    (messagePayload.data.messages || []).some((message) => message.sender_type === "admin" && /checking this/.test(message.message)),
    "support ticket should include the admin reply"
  );

  const closePayload = await expectStatus(
    request(baseUrl, "PATCH", `/dash/v1/support-tickets/${ticket._id}/status`, {
      token: supportManageTokens.accessToken,
      body: { status: "closed", admin_note: "Resolved by support." },
    }),
    200,
    "support.manage admin should close support tickets"
  );
  assert.equal(closePayload.data.status, "closed");
  assert.ok(closePayload.data.closed_at, "closed support ticket should include closed_at");

  const [statusAudit, messageAudit] = await Promise.all([
    AuditLogModel.findOne({ action: "support_ticket_status_updated", entity_id: ticket._id }).lean(),
    AuditLogModel.findOne({ action: "support_ticket_admin_message_added", entity_id: ticket._id }).lean(),
  ]);
  assert.ok(statusAudit, "support status update should be audited");
  assert.ok(messageAudit, "support admin message should be audited");
  assert.equal(String(statusAudit.company_id), String(company._id));
  assert.equal(String(messageAudit.company_id), String(company._id));

  console.log("Admin support integration verified for support.view/support.manage boundaries, admin status updates, replies, close behavior, aliases, and audit logs.");
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
