import assert from "node:assert/strict";
import bcryptjs from "bcryptjs";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET ||= "audit-logging-integration-secret";
process.env.ACCESS_TOKEN_EXPIRATION_MINUTES ||= "30";
process.env.REFRESH_TOKEN_EXPIRATION_DAYS ||= "30";
process.env.HEALTH_SECRET ||= "audit-logging-health-secret";

const nowToken = () => new Date().toISOString().replace(/[-:.TZ]/g, "");

function jsonHeaders(extra = {}) {
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...extra,
  };
}

async function request(baseUrl, method, path, { token, body, headers } = {}) {
  const hasBody = !["GET", "HEAD"].includes(method);
  return fetch(`${baseUrl}${path}`, {
    method,
    headers: jsonHeaders({
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    }),
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

async function main() {
  const mongo = await MongoMemoryServer.create({
    instance: {
      dbName: `halajob-audit-logging-${nowToken()}`,
    },
  });

  process.env.CONNECTION_URL = mongo.getUri();

  const [{ default: app }, models, tokenService, auditLogService] = await Promise.all([
    import("../app.js"),
    import("../models/index.js"),
    import("../services/tokenService.js"),
    import("../services/auditLog.service.js"),
  ]);

  const { AuditLogModel, RoleModel, UserModel } = models;
  const { generateAuthTokens } = tokenService;
  const { writeAuditLog } = auditLogService;

  await mongoose.connect(process.env.CONNECTION_URL, {
    serverSelectionTimeoutMS: 10000,
  });

  const suffix = nowToken();
  const [dashRole, inactiveDashRole, employeeRole] = await RoleModel.create([
    {
      log_to: "dash",
      name: `audit-admin-${suffix}`,
      role_number: 930001,
      title_ar: "Admin",
      title_en: "Admin",
      status: true,
      is_system: true,
    },
    {
      log_to: "dash",
      name: `audit-inactive-admin-${suffix}`,
      role_number: 930002,
      title_ar: "Inactive Admin",
      title_en: "Inactive Admin",
      status: false,
      is_system: true,
    },
    {
      log_to: "employee",
      name: `audit-employee-${suffix}`,
      role_number: 930003,
      title_ar: "Employee",
      title_en: "Employee",
      status: true,
      is_system: true,
    },
  ]);

  const passwordHash = await bcryptjs.hash("CorrectPass123!", 10);
  const phoneSeed = suffix.slice(-8);
  const [adminUser, inactiveUser, inactiveRoleUser, employeeUser] = await UserModel.create([
    {
      first_name: "Audit",
      last_name: "Admin",
      email: `audit.admin.${suffix}@example.com`,
      gender: "female",
      role_id: dashRole._id,
      password: passwordHash,
      status: true,
      phone: `+1555${phoneSeed}01`,
      phone_e164: `+1555${phoneSeed}01`,
      phone_country: "US",
      phone_code: "+1",
      phone_national: `555${phoneSeed}01`,
    },
    {
      first_name: "Audit",
      last_name: "Inactive",
      email: `audit.inactive.${suffix}@example.com`,
      gender: "male",
      role_id: dashRole._id,
      password: passwordHash,
      status: false,
      phone: `+1555${phoneSeed}02`,
      phone_e164: `+1555${phoneSeed}02`,
      phone_country: "US",
      phone_code: "+1",
      phone_national: `555${phoneSeed}02`,
    },
    {
      first_name: "Audit",
      last_name: "InactiveRole",
      email: `audit.inactive.role.${suffix}@example.com`,
      gender: "male",
      role_id: inactiveDashRole._id,
      password: passwordHash,
      status: true,
      phone: `+1555${phoneSeed}03`,
      phone_e164: `+1555${phoneSeed}03`,
      phone_country: "US",
      phone_code: "+1",
      phone_national: `555${phoneSeed}03`,
    },
    {
      first_name: "Audit",
      last_name: "Employee",
      email: `audit.employee.${suffix}@example.com`,
      gender: "female",
      role_id: employeeRole._id,
      password: passwordHash,
      status: true,
      phone: `+1555${phoneSeed}04`,
      phone_e164: `+1555${phoneSeed}04`,
      phone_country: "US",
      phone_code: "+1",
      phone_national: `555${phoneSeed}04`,
    },
  ]);

  const server = app.listen(0);

  try {
    await new Promise((resolve) => server.once("listening", resolve));
    const { port } = server.address();
    const baseUrl = `http://127.0.0.1:${port}`;

    await expectStatus(
      request(baseUrl, "POST", "/dash/v1/auth/login", {
        body: {
          email: adminUser.email,
        },
      }),
      400,
      "admin login missing credentials"
    );

    await expectStatus(
      request(baseUrl, "POST", "/dash/v1/auth/login", {
        body: {
          email: `missing.${suffix}@example.com`,
          password: "WrongPass123!",
        },
      }),
      400,
      "admin login unknown user"
    );

    await expectStatus(
      request(baseUrl, "POST", "/dash/v1/auth/login", {
        body: {
          email: adminUser.email,
          password: "WrongPass123!",
        },
      }),
      400,
      "admin login wrong password"
    );

    await expectStatus(
      request(baseUrl, "POST", "/dash/v1/auth/login", {
        body: {
          email: employeeUser.email,
          password: "CorrectPass123!",
        },
      }),
      403,
      "employee blocked from admin login"
    );

    await expectStatus(
      request(baseUrl, "POST", "/dash/v1/auth/login", {
        body: {
          email: inactiveUser.email,
          password: "CorrectPass123!",
        },
      }),
      403,
      "inactive admin blocked from admin login"
    );

    await expectStatus(
      request(baseUrl, "POST", "/dash/v1/auth/login", {
        body: {
          email: inactiveRoleUser.email,
          password: "CorrectPass123!",
        },
      }),
      403,
      "inactive admin role blocked from admin login"
    );

    await expectStatus(
      request(baseUrl, "POST", "/dash/v1/auth/login", {
        body: {
          email: adminUser.email,
          password: "CorrectPass123!",
        },
      }),
      200,
      "admin login success"
    );

    const failureReasons = await AuditLogModel.find({ action: "admin_login_failed" })
      .sort({ createdAt: 1 })
      .lean();

    assert.deepEqual(
      failureReasons.map((entry) => entry.metadata?.reason),
      [
        "missing_credentials",
        "user_not_found",
        "invalid_password",
        "wrong_role",
        "inactive_user",
        "inactive_role",
      ],
      "admin login failures should be audited with stable reason keys"
    );

    assert.equal(
      await AuditLogModel.countDocuments({ action: "admin_login_succeeded", actor_user_id: adminUser._id }),
      1,
      "successful admin login should be audited"
    );

    const tokens = await generateAuthTokens(adminUser, {
      brand: "Audit Browser",
      model_name: "Integration",
      is_device: false,
    });

    const createdEmail = `created.admin.${suffix}@example.com`;
    await expectStatus(
      request(baseUrl, "POST", "/dash/v1/auth/admins", {
        token: tokens.accessToken,
        body: {
          first_name: "Created",
          last_name: "Admin",
          email: createdEmail,
          password: "CreatedPass123!",
          gender: "female",
          role_id: String(dashRole._id),
          phone_code: "+1",
          phone_country: "US",
          phone_national: `777${phoneSeed}99`,
          status: true,
        },
      }),
      201,
      "dashboard admin creation"
    );

    const createdUser = await UserModel.findOne({ email: createdEmail }).lean();
    assert.ok(createdUser, "created admin user should exist");

    const createAudit = await AuditLogModel.findOne({
      action: "admin_user_created",
      actor_user_id: adminUser._id,
      entity_id: createdUser._id,
    }).lean();

    assert.ok(createAudit, "admin creation should be audited");
    assert.equal(createAudit.entity_type, "user", "admin creation audit should target a user entity");
    assert.equal(createAudit.new_value?.email, createdEmail, "admin creation audit should store safe user metadata");
    assert.equal(createAudit.new_value?.password, undefined, "admin creation audit must never store password");

    const circular = { safe: "visible" };
    circular.self = circular;
    const longNote = "x".repeat(2100);
    const preservedObjectId = new mongoose.Types.ObjectId();
    await writeAuditLog({
      req: {
        ip: "127.0.0.1",
        headers: {
          "user-agent": "audit-redaction-integration",
          authorization: "Bearer should-not-be-stored",
        },
      },
      actorUserId: adminUser._id,
      actorType: "admin",
      action: "audit_redaction_probe",
      entityType: "other",
      oldValue: {
        password: "old-password",
        nested: {
          accessToken: "old-access-token",
          safe_status: "before",
        },
      },
      newValue: {
        passcode: "123456",
        another_device_code: "654321",
        safe_status: "after",
      },
      metadata: {
        apiKey: "api-key-secret",
        refresh_token: "refresh-token-secret",
        cookie: "session=secret",
        privateKey: "private-key-secret",
        binary_blob: Buffer.from("secret bytes", "utf8"),
        circular,
        preserved_object_id: preservedObjectId,
        nested_array: [
          { password: "array-password", visible: "kept" },
          { otp: "999999" },
        ],
      },
      note: longNote,
    });

    const redactionAudit = await AuditLogModel.findOne({ action: "audit_redaction_probe" }).lean();
    assert.ok(redactionAudit, "direct audit redaction probe should be written");
    assert.equal(redactionAudit.old_value.password, "[REDACTED]");
    assert.equal(redactionAudit.old_value.nested.accessToken, "[REDACTED]");
    assert.equal(redactionAudit.old_value.nested.safe_status, "before");
    assert.equal(redactionAudit.new_value.passcode, "[REDACTED]");
    assert.equal(redactionAudit.new_value.another_device_code, "[REDACTED]");
    assert.equal(redactionAudit.new_value.safe_status, "after");
    assert.equal(redactionAudit.metadata.apiKey, "[REDACTED]");
    assert.equal(redactionAudit.metadata.refresh_token, "[REDACTED]");
    assert.equal(redactionAudit.metadata.cookie, "[REDACTED]");
    assert.equal(redactionAudit.metadata.privateKey, "[REDACTED]");
    assert.equal(redactionAudit.metadata.binary_blob, "[binary:12]");
    assert.equal(redactionAudit.metadata.circular.safe, "visible");
    assert.equal(redactionAudit.metadata.circular.self, "[Circular]");
    assert.equal(redactionAudit.metadata.nested_array[0].password, "[REDACTED]");
    assert.equal(redactionAudit.metadata.nested_array[0].visible, "kept");
    assert.equal(redactionAudit.metadata.nested_array[1].otp, "[REDACTED]");
    assert.equal(String(redactionAudit.metadata.preserved_object_id), String(preservedObjectId));
    assert.match(redactionAudit.note, /\.\.\.\[truncated\]$/);
    assert.ok(redactionAudit.note.length < longNote.length, "long audit notes should be truncated");

    console.log("Audit logging integration verified for admin auth, admin creation, and audit secret redaction.");
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    await mongoose.disconnect();
    await mongo.stop();
  }
}

main().catch(async (error) => {
  console.error(error);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
