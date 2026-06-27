import assert from "node:assert/strict";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET ||= "admin-resource-redaction-integration-secret";
process.env.ACCESS_TOKEN_EXPIRATION_MINUTES ||= "30";
process.env.REFRESH_TOKEN_EXPIRATION_DAYS ||= "30";
process.env.HEALTH_SECRET ||= "admin-resource-redaction-health-secret";

let mongo;
let server;

const nowToken = () => new Date().toISOString().replace(/[-:.TZ]/g, "");
const sensitiveUserFields = [
  "password",
  "passcode",
  "another_device_code",
  "passcode_expires_at",
  "another_device_expires_at",
  "otp_last_sent_at",
  "pending_device",
  "device",
];
const sensitiveFcmFields = ["token", "device_id", "model_id", "build_id"];

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
    headers: token
      ? authHeaders(token, headers)
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

function userSeed({ firstName, lastName, email, roleId, phone, extras = {} }) {
  return {
    first_name: firstName,
    last_name: lastName,
    email,
    gender: "male",
    role_id: roleId,
    password: "seed-password-hash",
    status: true,
    phone: `+1555${phone}`,
    phone_e164: `+1555${phone}`,
    phone_country: "US",
    phone_code: "+1",
    phone_national: `555${phone}`,
    ...extras,
  };
}

function assertNoFields(object, fields, label) {
  assert.ok(object && typeof object === "object", `${label} should be an object`);
  for (const field of fields) {
    assert.equal(
      Object.prototype.hasOwnProperty.call(object, field),
      false,
      `${label} must not expose ${field}`
    );
  }
}

function assertSafeUser(object, label) {
  assertNoFields(object, sensitiveUserFields, label);
}

function assertSafeFcmToken(object, label) {
  assertNoFields(object, sensitiveFcmFields, label);
  if (object.user && typeof object.user === "object") {
    assertSafeUser(object.user, `${label}.user`);
  }
}

async function main() {
  mongo = await MongoMemoryServer.create({
    instance: {
      dbName: `halajob-admin-resource-redaction-${nowToken()}`,
    },
  });

  process.env.CONNECTION_URL = mongo.getUri();

  const [{ default: app }, models, tokenService] = await Promise.all([
    import("../app.js"),
    import("../models/index.js"),
    import("../services/tokenService.js"),
  ]);

  const { FcmTokenModel, RoleModel, UserModel } = models;
  const { generateAuthTokens } = tokenService;

  await mongoose.connect(process.env.CONNECTION_URL, {
    serverSelectionTimeoutMS: 10000,
  });

  const suffix = nowToken();
  const phoneSeed = suffix.slice(-8);

  const [dashRole, employeeRole] = await RoleModel.create([
    {
      log_to: "dash",
      name: `admin-resource-redaction-dash-${suffix}`,
      role_number: 1,
      title_ar: "Dashboard Admin",
      title_en: "Dashboard Admin",
      status: true,
      is_system: true,
    },
    {
      log_to: "employee",
      name: `admin-resource-redaction-employee-${suffix}`,
      role_number: 4,
      title_ar: "Employee",
      title_en: "Employee",
      status: true,
      is_system: true,
    },
  ]);

  const [adminUser, seekerUser, sensitiveUser] = await UserModel.create([
    userSeed({
      firstName: "Redaction",
      lastName: "Admin",
      email: `redaction.admin.${suffix}@example.com`,
      roleId: dashRole._id,
      phone: `${phoneSeed}01`,
    }),
    userSeed({
      firstName: "Redaction",
      lastName: "Seeker",
      email: `redaction.seeker.${suffix}@example.com`,
      roleId: employeeRole._id,
      phone: `${phoneSeed}02`,
    }),
    userSeed({
      firstName: "Sensitive",
      lastName: "User",
      email: `redaction.sensitive.${suffix}@example.com`,
      roleId: employeeRole._id,
      phone: `${phoneSeed}03`,
      extras: {
        passcode: "123456",
        passcode_expires_at: new Date(Date.now() + 60_000),
        another_device_code: "654321",
        another_device_expires_at: new Date(Date.now() + 60_000),
        otp_last_sent_at: new Date(),
        pending_device: {
          brand: "Samsung",
          model_name: "Galaxy",
          model_id: "pending-model-id",
          is_device: true,
          build_id: "pending-build-id",
        },
        device: [
          {
            brand: "Samsung",
            model_name: "Galaxy",
            model_id: "model-id",
            is_device: true,
            build_id: "build-id",
            last_seen_at: new Date(),
          },
        ],
      },
    }),
  ]);

  const fcmToken = await FcmTokenModel.create({
    user: sensitiveUser._id,
    token: `fcm-secret-token-${suffix}`,
    platform: "android",
    device_id: `device-${suffix}`,
    brand: "Samsung",
    model_name: "Galaxy Test",
    model_id: "model-secret",
    build_id: "build-secret",
    topics: ["jobs"],
  });

  const device = { brand: "Admin Resource", model_name: "Integration", is_device: false };
  const [adminTokens, seekerTokens] = await Promise.all([
    generateAuthTokens(adminUser, device),
    generateAuthTokens(seekerUser, device),
  ]);

  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  await expectStatus(
    request(baseUrl, "GET", "/dash/v1/resources/users"),
    401,
    "missing token denied for generic admin resources"
  );

  await expectStatus(
    request(baseUrl, "GET", "/dash/v1/resources/users", {
      token: seekerTokens.accessToken,
    }),
    403,
    "non-admin denied for generic admin resources"
  );

  await expectStatus(
    request(baseUrl, "GET", "/dash/v1/resources/notarealresource", {
      token: adminTokens.accessToken,
    }),
    404,
    "unknown admin resource denied"
  );

  const usersList = await expectStatus(
    request(baseUrl, "GET", "/dash/v1/resources/users?limit=50", {
      token: adminTokens.accessToken,
    }),
    200,
    "admin lists users through generic resources"
  );
  const listedSensitiveUser = (usersList.data || []).find((item) => String(item._id) === String(sensitiveUser._id));
  assert.ok(listedSensitiveUser, "user list should include the seeded sensitive user");
  assertSafeUser(listedSensitiveUser, "listed user");

  const userDetails = await expectStatus(
    request(baseUrl, "GET", `/dash/v1/resources/users/${sensitiveUser._id}`, {
      token: adminTokens.accessToken,
    }),
    200,
    "admin reads one user through generic resources"
  );
  assertSafeUser(userDetails.data, "user details");

  const createdUserPayload = await expectStatus(
    request(baseUrl, "POST", "/dash/v1/resources/users", {
      token: adminTokens.accessToken,
      body: {
        first_name: "Created",
        last_name: "User",
        email: `redaction.created.${suffix}@example.com`,
        role_id: employeeRole._id,
        password: "PlainCreatePassword123!",
        passcode: "777777",
        another_device_code: "888888",
        pending_device: {
          brand: "Apple",
          model_name: "iPhone",
          is_device: true,
          build_id: "ios-build-secret",
        },
      },
    }),
    201,
    "admin creates user through generic resources"
  );
  assertSafeUser(createdUserPayload.data, "created user response");
  const createdUserInDb = await UserModel.findById(createdUserPayload.data._id).lean();
  assert.ok(createdUserInDb.password, "created user password should still be stored in the database");
  assert.notEqual(
    createdUserInDb.password,
    "PlainCreatePassword123!",
    "created user password should be hashed before storage"
  );

  const updatedUserPayload = await expectStatus(
    request(baseUrl, "PATCH", `/dash/v1/resources/users/${sensitiveUser._id}`, {
      token: adminTokens.accessToken,
      body: {
        password: "PlainUpdatePassword123!",
        passcode: "222222",
        another_device_code: "333333",
        pending_device: {
          brand: "Google",
          model_name: "Pixel",
          is_device: true,
          build_id: "pixel-build-secret",
        },
      },
    }),
    202,
    "admin updates user through generic resources"
  );
  assertSafeUser(updatedUserPayload.data, "updated user response");

  const tokenList = await expectStatus(
    request(baseUrl, "GET", "/dash/v1/resources/fcmtokens?limit=50", {
      token: adminTokens.accessToken,
    }),
    200,
    "admin lists FCM tokens through generic resources"
  );
  const listedFcmToken = (tokenList.data || []).find((item) => String(item._id) === String(fcmToken._id));
  assert.ok(listedFcmToken, "FCM token list should include the seeded token record");
  assertSafeFcmToken(listedFcmToken, "listed FCM token");

  const tokenDetails = await expectStatus(
    request(baseUrl, "GET", `/dash/v1/resources/fcmtokens/${fcmToken._id}`, {
      token: adminTokens.accessToken,
    }),
    200,
    "admin reads one FCM token through generic resources"
  );
  assertSafeFcmToken(tokenDetails.data, "FCM token details");

  const legacyTokenDetails = await expectStatus(
    request(baseUrl, "GET", `/dash/v1/fcm-tokens/${fcmToken._id}`, {
      token: adminTokens.accessToken,
    }),
    200,
    "admin reads one FCM token through legacy resource alias"
  );
  assertSafeFcmToken(legacyTokenDetails.data, "legacy FCM token details");

  console.log("Admin resource redaction integration verified for user secrets, populated users, and FCM tokens.");
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
