import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import mongoose from "mongoose";
import { IntegrationMongoServer as MongoMemoryServer } from "./utils/integrationMongo.js";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET ||= "admin-permission-integration-secret";
process.env.ACCESS_TOKEN_EXPIRATION_MINUTES ||= "30";
process.env.REFRESH_TOKEN_EXPIRATION_DAYS ||= "30";
process.env.HEALTH_SECRET ||= "admin-permission-health-secret";

let mongo;
let server;
let tempFilesDir;

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

async function main() {
  const fileFixtureName = `dashboard-private-${nowToken()}.pdf`;
  const deniedFileFixtureName = `dashboard-private-${nowToken()}.exe`;
  tempFilesDir = path.join(os.tmpdir(), `halajob-admin-permission-files-${nowToken()}`);
  await fs.mkdir(path.join(tempFilesDir, "files"), { recursive: true });
  await fs.writeFile(path.join(tempFilesDir, "files", fileFixtureName), "%PDF-1.4\n% test dashboard private file\n");
  await fs.writeFile(path.join(tempFilesDir, "files", deniedFileFixtureName), "not allowed");

  mongo = await MongoMemoryServer.create({
    instance: {
      dbName: `halajob-admin-permission-${nowToken()}`,
    },
  });

  process.env.CONNECTION_URL = mongo.getUri();
  process.env.FILES_DIRECTORY = tempFilesDir;

  const [{ default: app }, models, tokenService] = await Promise.all([
    import("../app.js"),
    import("../models/index.js"),
    import("../services/tokenService.js"),
  ]);

  const { PermissionModel, RoleModel, UserModel } = models;
  const { generateAuthTokens } = tokenService;

  await mongoose.connect(process.env.CONNECTION_URL, {
    serverSelectionTimeoutMS: 10000,
  });

  const suffix = nowToken();
  const phoneSeed = suffix.slice(-8);

  const [
    auditViewPermission,
    usersReadPermission,
    usersManagePermission,
    companiesModeratePermission,
    filesReadPermission,
  ] = await Promise.all([
    createPermission(PermissionModel, "audit.view"),
    createPermission(PermissionModel, "users.read"),
    createPermission(PermissionModel, "users.manage"),
    createPermission(PermissionModel, "companies.moderate"),
    createPermission(PermissionModel, "files.read"),
  ]);

  const [superAdminRole, auditRole, userReadRole, userManageRole, companyModerationRole, fileReadRole, employeeRole] = await RoleModel.create([
    {
      log_to: "dash",
      name: `admin-permission-super-${suffix}`,
      role_number: 1,
      title_ar: "Super Admin",
      title_en: "Super Admin",
      permissions: [],
      status: true,
      is_system: true,
    },
    {
      log_to: "dash",
      name: `admin-permission-audit-${suffix}`,
      role_number: 950002,
      title_ar: "Audit Viewer",
      title_en: "Audit Viewer",
      permissions: [auditViewPermission._id],
      status: true,
      is_system: false,
    },
    {
      log_to: "dash",
      name: `admin-permission-user-read-${suffix}`,
      role_number: 950003,
      title_ar: "User Reader",
      title_en: "User Reader",
      permissions: [usersReadPermission._id],
      status: true,
      is_system: false,
    },
    {
      log_to: "dash",
      name: `admin-permission-user-manage-${suffix}`,
      role_number: 950004,
      title_ar: "User Manager",
      title_en: "User Manager",
      permissions: [usersManagePermission._id],
      status: true,
      is_system: false,
    },
    {
      log_to: "dash",
      name: `admin-permission-company-moderator-${suffix}`,
      role_number: 950005,
      title_ar: "Company Moderator",
      title_en: "Company Moderator",
      permissions: [companiesModeratePermission._id],
      status: true,
      is_system: false,
    },
    {
      log_to: "dash",
      name: `admin-permission-file-reader-${suffix}`,
      role_number: 950006,
      title_ar: "File Reader",
      title_en: "File Reader",
      permissions: [filesReadPermission._id],
      status: true,
      is_system: false,
    },
    {
      log_to: "employee",
      name: `admin-permission-employee-${suffix}`,
      role_number: 950007,
      title_ar: "Employee",
      title_en: "Employee",
      status: true,
      is_system: true,
    },
  ]);

  const [superAdminUser, auditUser, userReadUser, userManageUser, companyModerationUser, fileReadUser, seekerUser] = await UserModel.create([
    userSeed({
      firstName: "Permission",
      lastName: "Super",
      email: `permission.super.${suffix}@example.com`,
      roleId: superAdminRole._id,
      phone: `${phoneSeed}01`,
    }),
    userSeed({
      firstName: "Permission",
      lastName: "Audit",
      email: `permission.audit.${suffix}@example.com`,
      roleId: auditRole._id,
      phone: `${phoneSeed}02`,
    }),
    userSeed({
      firstName: "Permission",
      lastName: "Reader",
      email: `permission.reader.${suffix}@example.com`,
      roleId: userReadRole._id,
      phone: `${phoneSeed}03`,
    }),
    userSeed({
      firstName: "Permission",
      lastName: "Manager",
      email: `permission.manager.${suffix}@example.com`,
      roleId: userManageRole._id,
      phone: `${phoneSeed}04`,
    }),
    userSeed({
      firstName: "Permission",
      lastName: "Moderator",
      email: `permission.moderator.${suffix}@example.com`,
      roleId: companyModerationRole._id,
      phone: `${phoneSeed}05`,
    }),
    userSeed({
      firstName: "Permission",
      lastName: "File",
      email: `permission.file.${suffix}@example.com`,
      roleId: fileReadRole._id,
      phone: `${phoneSeed}06`,
    }),
    userSeed({
      firstName: "Permission",
      lastName: "Seeker",
      email: `permission.seeker.${suffix}@example.com`,
      roleId: employeeRole._id,
      phone: `${phoneSeed}07`,
    }),
  ]);

  const device = { brand: "Admin Permission", model_name: "Integration", is_device: false };
  const [superAdminTokens, auditTokens, userReadTokens, userManageTokens, companyModerationTokens, fileReadTokens, seekerTokens] = await Promise.all([
    generateAuthTokens(superAdminUser, device),
    generateAuthTokens(auditUser, device),
    generateAuthTokens(userReadUser, device),
    generateAuthTokens(userManageUser, device),
    generateAuthTokens(companyModerationUser, device),
    generateAuthTokens(fileReadUser, device),
    generateAuthTokens(seekerUser, device),
  ]);

  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  await expectStatus(
    request(baseUrl, "GET", "/dash/v1/audit-logs"),
    401,
    "missing token denied before admin permissions"
  );

  await expectStatus(
    request(baseUrl, "GET", "/dash/v1/audit-logs", { token: seekerTokens.accessToken }),
    403,
    "non-dashboard user denied before admin permissions"
  );

  const superAdminUsers = await expectStatus(
    request(baseUrl, "GET", "/dash/v1/resources/users", { token: superAdminTokens.accessToken }),
    200,
    "role_number 1 dashboard admin bypasses fine-grained permissions"
  );
  assert.equal(superAdminUsers.status, true, "super admin resource response should be successful");

  const auditLogs = await expectStatus(
    request(baseUrl, "GET", "/dash/v1/audit-logs", { token: auditTokens.accessToken }),
    200,
    "audit.view role can read audit logs"
  );
  assert.equal(auditLogs.status, true, "audit log response should be successful");

  const auditMissingUsers = await expectStatus(
    request(baseUrl, "GET", "/dash/v1/resources/users", { token: auditTokens.accessToken }),
    403,
    "audit-only role cannot read generic user resources"
  );
  assert.equal(auditMissingUsers.requiredPermission, "users.read");

  const readUsers = await expectStatus(
    request(baseUrl, "GET", "/dash/v1/resources/users", { token: userReadTokens.accessToken }),
    200,
    "users.read role can read generic user resources"
  );
  assert.equal(readUsers.status, true, "users.read response should be successful");

  const legacyReadUsers = await expectStatus(
    request(baseUrl, "GET", "/dash/v1/User", { token: userReadTokens.accessToken }),
    200,
    "users.read role can read legacy user resource alias"
  );
  assert.equal(legacyReadUsers.status, true, "legacy users.read response should be successful");

  const readUserCreateDenied = await expectStatus(
    request(baseUrl, "POST", "/dash/v1/resources/users", {
      token: userReadTokens.accessToken,
      body: {
        first_name: "Denied",
        last_name: "Create",
        email: `permission.denied.${suffix}@example.com`,
        role_id: employeeRole._id,
      },
    }),
    403,
    "users.read role cannot create users"
  );
  assert.equal(readUserCreateDenied.requiredPermission, "users.create");

  const createdUser = await expectStatus(
    request(baseUrl, "POST", "/dash/v1/resources/users", {
      token: userManageTokens.accessToken,
      body: {
        first_name: "Allowed",
        last_name: "Create",
        email: `permission.allowed.${suffix}@example.com`,
        role_id: employeeRole._id,
        password: "AdminPermissionCreate123!",
      },
    }),
    201,
    "users.manage role can create users"
  );
  assert.equal(createdUser.status, true, "users.manage create response should be successful");
  assert.ok(createdUser.data?._id, "created user should include an id");

  const companyRequests = await expectStatus(
    request(baseUrl, "GET", "/dash/v1/company-requests", { token: companyModerationTokens.accessToken }),
    200,
    "companies.moderate role can read company moderation queue"
  );
  assert.equal(companyRequests.status, true, "company moderation response should be successful");

  const companyModeratorMissingAudit = await expectStatus(
    request(baseUrl, "GET", "/dash/v1/audit-logs", { token: companyModerationTokens.accessToken }),
    403,
    "companies.moderate role cannot read audit logs"
  );
  assert.equal(companyModeratorMissingAudit.requiredPermission, "audit.view");

  const auditMissingFiles = await expectStatus(
    request(baseUrl, "GET", `/dash/v1/file/${fileFixtureName}`, { token: auditTokens.accessToken }),
    403,
    "audit-only role cannot download protected dashboard files"
  );
  assert.equal(auditMissingFiles.requiredPermission, "files.read");

  const fileResponse = await request(baseUrl, "GET", `/dash/v1/file/${fileFixtureName}`, {
    token: fileReadTokens.accessToken,
  });
  assert.equal(fileResponse.status, 200, "files.read role should download protected dashboard PDF files");
  assert.match(fileResponse.headers.get("content-disposition") || "", /attachment/i);
  assert.equal(fileResponse.headers.get("x-content-type-options"), "nosniff");
  assert.equal(fileResponse.headers.get("cache-control"), "no-store");
  await fileResponse.arrayBuffer();

  const deniedExtension = await expectStatus(
    request(baseUrl, "GET", `/dash/v1/file/${deniedFileFixtureName}`, { token: fileReadTokens.accessToken }),
    403,
    "protected dashboard file route should reject non-image/non-PDF extensions"
  );
  assert.equal(deniedExtension.message, "file_access_forbidden");

  console.log("Admin permission integration verified for super-admin bypass, limited admin allow/deny, static operations, generic resource routes, and protected dashboard file downloads.");
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
    if (tempFilesDir) await fs.rm(tempFilesDir, { recursive: true, force: true });
  });
