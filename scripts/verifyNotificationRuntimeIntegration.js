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
    AuditLogModel,
    FcmTokenModel,
    NotificationModel,
    NotificationPreferenceModel,
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
  const employeeRole = await RoleModel.create({
    log_to: "employee",
    name: `notification-runtime-employee-${suffix}`,
    role_number: 4,
    title_ar: "Employee",
    title_en: "Employee",
    status: true,
    is_system: true,
  });

  const createPermission = async (key) => {
    const [group, action = "manage"] = key.split(".");
    return PermissionModel.create({
      key,
      group,
      action,
      title_ar: key,
      title_en: key,
      status: true,
    });
  };

  const [notificationsViewPermission, notificationsManagePermission] = await Promise.all([
    createPermission("notifications.view"),
    createPermission("notifications.manage"),
  ]);

  const [notificationsViewRole, notificationsManageRole, dashNoNotificationsRole] = await RoleModel.create([
    {
      log_to: "dash",
      name: `notification-runtime-view-${suffix}`,
      role_number: 970001,
      title_ar: "Notification Viewer",
      title_en: "Notification Viewer",
      permissions: [notificationsViewPermission._id],
      status: true,
      is_system: false,
    },
    {
      log_to: "dash",
      name: `notification-runtime-manage-${suffix}`,
      role_number: 970002,
      title_ar: "Notification Manager",
      title_en: "Notification Manager",
      permissions: [notificationsManagePermission._id],
      status: true,
      is_system: false,
    },
    {
      log_to: "dash",
      name: `notification-runtime-none-${suffix}`,
      role_number: 970003,
      title_ar: "No Notifications",
      title_en: "No Notifications",
      permissions: [],
      status: true,
      is_system: false,
    },
  ]);

  const [user, otherUser, notificationViewAdmin, notificationManageAdmin, noNotificationAdmin] = await UserModel.create([
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
    {
      first_name: "Notify",
      last_name: "Viewer",
      email: `notify.viewer.${suffix}@example.com`,
      gender: "male",
      role_id: notificationsViewRole._id,
      password: "not-used",
      status: true,
      phone: `+1555${phoneSeed}03`,
      phone_e164: `+1555${phoneSeed}03`,
      phone_country: "US",
      phone_code: "+1",
      phone_national: `555${phoneSeed}03`,
    },
    {
      first_name: "Notify",
      last_name: "Manager",
      email: `notify.manager.${suffix}@example.com`,
      gender: "female",
      role_id: notificationsManageRole._id,
      password: "not-used",
      status: true,
      phone: `+1555${phoneSeed}04`,
      phone_e164: `+1555${phoneSeed}04`,
      phone_country: "US",
      phone_code: "+1",
      phone_national: `555${phoneSeed}04`,
    },
    {
      first_name: "Notify",
      last_name: "NoPerm",
      email: `notify.noperm.${suffix}@example.com`,
      gender: "male",
      role_id: dashNoNotificationsRole._id,
      password: "not-used",
      status: true,
      phone: `+1555${phoneSeed}05`,
      phone_e164: `+1555${phoneSeed}05`,
      phone_country: "US",
      phone_code: "+1",
      phone_national: `555${phoneSeed}05`,
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

  const [tokens, otherTokens, viewAdminTokens, manageAdminTokens, noNotificationAdminTokens] = await Promise.all([
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
    generateAuthTokens(notificationViewAdmin, {
      brand: "Notification Runtime View Admin",
      model_name: "Integration",
      is_device: false,
    }),
    generateAuthTokens(notificationManageAdmin, {
      brand: "Notification Runtime Manage Admin",
      model_name: "Integration",
      is_device: false,
    }),
    generateAuthTokens(noNotificationAdmin, {
      brand: "Notification Runtime No Perm Admin",
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

    const defaultPreferencesPayload = await expectStatus(
      request(baseUrl, "GET", "/notifications/v1/preferences", {
        token: tokens.accessToken,
      }),
      200,
      "notification preferences default read"
    );
    assert.equal(defaultPreferencesPayload.data.channels.in_app, true);
    assert.equal(defaultPreferencesPayload.data.channels.push, true);
    assert.equal(defaultPreferencesPayload.data.categories.applications, true);

    const updatedPreferencesPayload = await expectStatus(
      request(baseUrl, "PUT", "/notifications/v1/preferences", {
        token: tokens.accessToken,
        body: {
          channels: { push: false },
          categories: { applications: false },
          quiet_hours: { enabled: true, start: "23:00", end: "06:00", timezone: "Europe/London" },
          lang: "ar",
        },
      }),
      200,
      "notification preferences update"
    );
    assert.equal(updatedPreferencesPayload.data.channels.push, false);
    assert.equal(updatedPreferencesPayload.data.channels.in_app, true);
    assert.equal(updatedPreferencesPayload.data.categories.applications, false);
    assert.equal(updatedPreferencesPayload.data.quiet_hours.enabled, true);
    assert.equal(updatedPreferencesPayload.data.lang, "ar");

    const legacyPreferencesPayload = await expectStatus(
      request(baseUrl, "GET", "/user/v1/notifications/preferences", {
        token: tokens.accessToken,
      }),
      200,
      "legacy notification preferences read"
    );
    assert.equal(legacyPreferencesPayload.data.categories.applications, false);

    const patchedPreferencesPayload = await expectStatus(
      request(baseUrl, "PATCH", "/notifications/v1/preferences", {
        token: tokens.accessToken,
        body: {
          marketing: true,
        },
      }),
      200,
      "notification preferences patch aliases"
    );
    assert.equal(patchedPreferencesPayload.data.categories.marketing, true);

    const storedPreferences = await NotificationPreferenceModel.findOne({ user_id: user._id }).lean();
    assert.equal(storedPreferences.categories.applications, false);
    assert.equal(storedPreferences.channels.push, false);

    await expectStatus(
      request(baseUrl, "POST", "/dash/v1/notifications/send", {
        token: tokens.accessToken,
        body: {
          user_id: user._id,
          title: "Should not send",
          body: "A normal app token cannot send dashboard notifications.",
        },
      }),
      403,
      "app user cannot send dashboard notifications"
    );

    await expectStatus(
      request(baseUrl, "POST", "/dash/v1/notifications/send", {
        token: noNotificationAdminTokens.accessToken,
        body: {
          user_id: user._id,
          title: "Should not send",
          body: "Missing notifications.manage permission.",
        },
      }),
      403,
      "dashboard admin without notification permission cannot send"
    );

    await expectStatus(
      request(baseUrl, "POST", "/dash/v1/notifications/send", {
        token: viewAdminTokens.accessToken,
        body: {
          user_id: user._id,
          title: "Should not send",
          body: "notifications.view is not enough to send.",
        },
      }),
      403,
      "notification viewer cannot send"
    );

    await expectStatus(
      request(baseUrl, "POST", "/dash/v1/notifications/send", {
        token: manageAdminTokens.accessToken,
        body: {},
      }),
      400,
      "admin notification requires recipients"
    );

    const blockedBeforeCount = await NotificationModel.countDocuments({ user_id: user._id });
    const blockedAdminSendPayload = await expectStatus(
      request(baseUrl, "POST", "/dash/v1/notifications/send", {
        token: manageAdminTokens.accessToken,
        body: {
          user_id: user._id,
          event_key: "application_status_rejected",
          route_key: "applications.status",
          params: { job: "Runtime Job" },
          push: true,
        },
      }),
      200,
      "admin notification respects disabled application category"
    );
    assert.equal(blockedAdminSendPayload.data.summary.saved_count, 0);
    assert.equal(blockedAdminSendPayload.data.summary.preference_blocked_count, 1);
    assert.equal(
      await NotificationModel.countDocuments({ user_id: user._id }),
      blockedBeforeCount,
      "disabled notification category should not create a notification record"
    );

    await expectStatus(
      request(baseUrl, "PUT", "/notifications/v1/preferences", {
        token: tokens.accessToken,
        body: {
          channels: { in_app: true, push: false },
          categories: { applications: true },
        },
      }),
      200,
      "notification preferences re-enable application in-app"
    );

    const allowedAdminSendPayload = await expectStatus(
      request(baseUrl, "POST", "/dash/v1/notifications/send", {
        token: manageAdminTokens.accessToken,
        body: {
          user_ids: [user._id, otherUser._id],
          title: "Campus application update",
          body: "Your application has a new update.",
          event_key: "application_status_shortlisted",
          route_key: "applications.status",
          push: true,
          data: { application_id: "runtime-application-1" },
        },
      }),
      200,
      "admin notification send"
    );
    assert.equal(allowedAdminSendPayload.data.summary.recipient_count, 2);
    assert.equal(allowedAdminSendPayload.data.summary.saved_count, 2);
    assert.equal(allowedAdminSendPayload.data.summary.push_success_count, 0);
    assert.ok(
      allowedAdminSendPayload.data.results.some((item) => item.note === "push_disabled_by_preferences"),
      "user with push disabled should save in-app but skip push"
    );

    const adminNotificationAudit = await AuditLogModel.findOne({
      action: "admin_notification_sent",
      entity_type: "notification",
    }).lean();
    assert.ok(adminNotificationAudit, "admin notification send should write an audit log");
    assert.equal(adminNotificationAudit.actor_type, "admin");

    const unreadBeforeMarkOne = await NotificationModel.countDocuments({ user_id: user._id, read: false });
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
      unreadBeforeMarkOne - 1,
      "mark one read should only change the selected notification"
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

    const unreadBeforeMarkAll = await NotificationModel.countDocuments({ user_id: user._id, read: false });
    const otherUnreadBeforeMarkAll = await NotificationModel.countDocuments({ user_id: otherUser._id, read: false });
    const markAllPayload = await expectStatus(
      request(baseUrl, "POST", "/notifications/v1/read-all", {
        token: tokens.accessToken,
      }),
      200,
      "mark all notifications read"
    );
    assert.equal(markAllPayload.data.modified_count, unreadBeforeMarkAll);
    assert.equal(
      await NotificationModel.countDocuments({ user_id: user._id, read: false }),
      0,
      "mark all read should clear own unread notifications"
    );
    assert.equal(
      await NotificationModel.countDocuments({ user_id: otherUser._id, read: false }),
      otherUnreadBeforeMarkAll,
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

    console.log("Notification runtime integration verified for list/read ownership, preferences, admin send permissions, preference enforcement, audit logs, and device token lifecycle.");
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
