import assert from "node:assert/strict";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET ||= "notification-runtime-integration-secret";
process.env.ACCESS_TOKEN_EXPIRATION_MINUTES ||= "30";
process.env.REFRESH_TOKEN_EXPIRATION_DAYS ||= "30";
process.env.HEALTH_SECRET ||= "notification-runtime-health-secret";

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
    headers: token ? authHeaders(token, headers) : { Accept: "application/json", ...headers },
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

async function main() {
  const mongo = await MongoMemoryServer.create({
    instance: {
      dbName: `halajob-notification-runtime-${nowToken()}`,
    },
  });

  process.env.CONNECTION_URL = mongo.getUri();

  const [{ default: app }, models, tokenService] = await Promise.all([
    import("../app.js"),
    import("../models/index.js"),
    import("../services/tokenService.js"),
  ]);

  const {
    FcmTokenModel,
    NotificationModel,
    RoleModel,
    UserModel,
  } = models;
  const { generateAuthTokens } = tokenService;

  await mongoose.connect(process.env.CONNECTION_URL, {
    serverSelectionTimeoutMS: 10000,
  });

  const suffix = nowToken();
  const phoneSeed = suffix.slice(-8);
  const employeeRole = await RoleModel.create({
    log_to: "employee",
    name: `notification-runtime-employee-${suffix}`,
    role_number: 4,
    title_ar: "Employee",
    title_en: "Employee",
    status: true,
    is_system: true,
  });

  const [user, otherUser] = await UserModel.create([
    {
      first_name: "Notify",
      last_name: "Owner",
      email: `notify.owner.${suffix}@example.com`,
      gender: "female",
      role_id: employeeRole._id,
      password: "not-used",
      status: true,
      phone: `+1555${phoneSeed}01`,
      phone_e164: `+1555${phoneSeed}01`,
      phone_country: "US",
      phone_code: "+1",
      phone_national: `555${phoneSeed}01`,
    },
    {
      first_name: "Notify",
      last_name: "Other",
      email: `notify.other.${suffix}@example.com`,
      gender: "male",
      role_id: employeeRole._id,
      password: "not-used",
      status: true,
      phone: `+1555${phoneSeed}02`,
      phone_e164: `+1555${phoneSeed}02`,
      phone_country: "US",
      phone_code: "+1",
      phone_national: `555${phoneSeed}02`,
    },
  ]);

  const [notificationA, notificationB, otherNotification] = await NotificationModel.create([
    {
      user_id: user._id,
      title: "Application shortlisted",
      body: "Your application moved forward.",
      read: false,
      type: "application_status_shortlisted",
      audience: "employee",
      route_key: "applications.detail",
      route_path: "applications/app-1",
      data: { application_id: "app-1" },
    },
    {
      user_id: user._id,
      title: "Interview scheduled",
      body: "You have a new interview.",
      read: false,
      type: "interview_scheduled",
      audience: "employee",
      route_key: "interviews.detail",
      route_path: "interviews/int-1",
      data: { interview_id: "int-1" },
    },
    {
      user_id: otherUser._id,
      title: "Other user's notification",
      body: "This must never leak.",
      read: false,
      type: "notification",
      audience: "employee",
    },
  ]);

  const [tokens, otherTokens] = await Promise.all([
    generateAuthTokens(user, {
      brand: "Notification Runtime",
      model_name: "Integration",
      is_device: false,
    }),
    generateAuthTokens(otherUser, {
      brand: "Notification Runtime Other",
      model_name: "Integration",
      is_device: false,
    }),
  ]);

  const server = app.listen(0);

  try {
    await new Promise((resolve) => server.once("listening", resolve));
    const { port } = server.address();
    const baseUrl = `http://127.0.0.1:${port}`;

    await expectStatus(
      request(baseUrl, "GET", "/notifications/v1/list", {}),
      401,
      "missing token notification list"
    );

    const listPayload = await expectStatus(
      request(baseUrl, "GET", "/notifications/v1/list?limit=10", {
        token: tokens.accessToken,
      }),
      200,
      "notification list"
    );
    assert.equal(listPayload.data.length, 2, "notification list should only include the authenticated user's items");
    assert.ok(
      listPayload.data.every((item) => String(item.id) !== String(otherNotification._id)),
      "notification list must not leak another user's notification"
    );
    assert.equal(listPayload.meta.unread_count, 2);
    assert.equal(listPayload.data[0].route_key || listPayload.data[1].route_key, "interviews.detail");

    const unreadPayload = await expectStatus(
      request(baseUrl, "GET", "/notifications/v1/unread-count", {
        token: tokens.accessToken,
      }),
      200,
      "notification unread count"
    );
    assert.equal(unreadPayload.data.unread_count, 2);

    const unreadListPayload = await expectStatus(
      request(baseUrl, "GET", "/notifications/v1/list?read=false", {
        token: tokens.accessToken,
      }),
      200,
      "unread notification list"
    );
    assert.equal(unreadListPayload.data.length, 2);

    const markOnePayload = await expectStatus(
      request(baseUrl, "POST", `/notifications/v1/${notificationA._id}/read`, {
        token: tokens.accessToken,
      }),
      200,
      "mark own notification read"
    );
    assert.equal(markOnePayload.data.read, true);
    assert.equal(
      await NotificationModel.countDocuments({ user_id: user._id, read: false }),
      1,
      "mark one read should leave one unread notification"
    );

    await expectStatus(
      request(baseUrl, "POST", `/notifications/v1/${otherNotification._id}/read`, {
        token: tokens.accessToken,
      }),
      404,
      "mark another user's notification read"
    );
    assert.equal(
      await NotificationModel.countDocuments({ _id: otherNotification._id, read: false }),
      1,
      "cross-user mark-read attempt must not mutate the other user's notification"
    );

    const markAllPayload = await expectStatus(
      request(baseUrl, "POST", "/notifications/v1/read-all", {
        token: tokens.accessToken,
      }),
      200,
      "mark all notifications read"
    );
    assert.equal(markAllPayload.data.modified_count, 1);
    assert.equal(
      await NotificationModel.countDocuments({ user_id: user._id, read: false }),
      0,
      "mark all read should clear own unread notifications"
    );
    assert.equal(
      await NotificationModel.countDocuments({ user_id: otherUser._id, read: false }),
      1,
      "mark all read must not mutate another user's notifications"
    );

    const deviceToken = `runtime-token-${suffix}`;
    const devicePayload = {
      token: deviceToken,
      platform: "android",
      deviceId: `device-${suffix}`,
      brand: "Samsung",
      model_name: "Galaxy Test",
      is_default: true,
      topics: ["jobs", "applications"],
    };

    const createdTokenPayload = await expectStatus(
      request(baseUrl, "POST", "/notifications/v1/device-token", {
        token: tokens.accessToken,
        body: devicePayload,
      }),
      201,
      "create notification device token"
    );
    assert.equal(createdTokenPayload.token, deviceToken);
    assert.equal(createdTokenPayload.revoked, false);
    assert.equal(createdTokenPayload.lang, "en");

    const updatedTokenPayload = await expectStatus(
      request(baseUrl, "POST", "/notifications/v1/device-token", {
        token: tokens.accessToken,
        body: {
          ...devicePayload,
          brand: "Samsung Updated",
          topics: ["jobs"],
        },
      }),
      200,
      "update notification device token"
    );
    assert.equal(updatedTokenPayload.brand, "Samsung Updated");
    assert.deepEqual(updatedTokenPayload.topics, ["jobs"]);

    await expectStatus(
      request(baseUrl, "POST", "/notifications/v1/device-token", {
        token: otherTokens.accessToken,
        body: devicePayload,
      }),
      409,
      "other user cannot claim existing device token"
    );

    await expectStatus(
      request(baseUrl, "DELETE", "/notifications/v1/device-token", {
        token: otherTokens.accessToken,
        body: { token: deviceToken },
      }),
      404,
      "other user cannot delete existing device token"
    );

    const deletePayload = await expectStatus(
      request(baseUrl, "DELETE", "/notifications/v1/device-token", {
        token: tokens.accessToken,
        body: { token: deviceToken },
      }),
      200,
      "delete own device token"
    );
    assert.equal(deletePayload.data.matched_count, 1);

    const storedToken = await FcmTokenModel.findOne({ token: deviceToken }).lean();
    assert.equal(storedToken.revoked, true);
    assert.equal(storedToken.last_error, "revoked_by_user");

    await expectStatus(
      request(baseUrl, "DELETE", "/notifications/v1/device-token", {
        token: tokens.accessToken,
        body: {},
      }),
      400,
      "delete device token missing identifier"
    );

    assert.equal(
      await NotificationModel.countDocuments({ _id: notificationB._id, user_id: user._id, read: true }),
      1,
      "second notification should be marked read by read-all"
    );

    console.log("Notification runtime integration verified for list/read ownership and device token lifecycle.");
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
