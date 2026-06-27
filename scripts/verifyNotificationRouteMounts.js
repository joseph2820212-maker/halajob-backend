import assert from "node:assert/strict";
import fs from "node:fs";
import listEndpoints from "express-list-endpoints";
import app from "../app.js";

const endpoints = listEndpoints(app);
const endpointByPath = new Map(endpoints.map((endpoint) => [endpoint.path, endpoint]));

const readSource = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const appSource = readSource("app.js");
const routeSource = readSource("routesNotifications/index.js");
const legacyRouteSource = readSource("routesUser/NotificationRote.js");
const dashRouteSource = readSource("routes/index.js");
const controllerSource = readSource("controllers/app/Notification/NotificationV1Controller.js");
const adminControllerSource = readSource("controllers/dash/adminNotificationController.js");
const preferenceServiceSource = readSource("services/notifications/notificationPreference.service.js");
const notificationServiceSource = readSource("notification/notificationService.js");

const requiredEndpoints = [
  ["GET", "/notifications/v1"],
  ["GET", "/notifications/v1/list"],
  ["GET", "/notifications/v1/unread-count"],
  ["GET", "/notifications/v1/preferences"],
  ["PUT", "/notifications/v1/preferences"],
  ["PATCH", "/notifications/v1/preferences"],
  ["POST", "/notifications/v1/read"],
  ["PATCH", "/notifications/v1/read"],
  ["POST", "/notifications/v1/read-all"],
  ["PATCH", "/notifications/v1/read-all"],
  ["POST", "/notifications/v1/:id/read"],
  ["PATCH", "/notifications/v1/:id/read"],
  ["POST", "/notifications/v1/device-token"],
  ["DELETE", "/notifications/v1/device-token"],
  ["POST", "/notifications/v1/device-token/delete"],
  ["DELETE", "/notifications/v1/device-token/:id"],
  ["GET", "/user/v1/notifications/preferences"],
  ["PUT", "/user/v1/notifications/preferences"],
  ["PATCH", "/user/v1/notifications/preferences"],
  ["POST", "/dash/v1/notifications/send"],
  ["POST", "/dash/v1/notification/send"],
  ["POST", "/dash/v1/operations/notifications/send"],
];

const missingEndpoints = requiredEndpoints
  .filter(([method, path]) => !endpointByPath.get(path)?.methods.includes(method))
  .map(([method, path]) => `${method} ${path}`);

assert.deepEqual(missingEndpoints, [], "Express app is missing notification v1 endpoints");

assert.ok(
  appSource.includes('app.use("/notifications/v1", notificationRoutes)'),
  "app.js must mount /notifications/v1"
);

const routeRequirements = [
  "router.use(authUser)",
  'router.get("/list"',
  'router.get("/preferences"',
  'router.put("/preferences"',
  'router.post("/read"',
  'router.post("/device-token"',
  'router.delete("/device-token"',
];

assert.deepEqual(
  routeRequirements.filter((snippet) => !routeSource.includes(snippet)),
  [],
  "routesNotifications/index.js is missing auth or launch routes"
);

assert.deepEqual(
  [
    'router.get("/preferences"',
    'router.put("/preferences"',
    "NotificationV1Controller.updatePreferences",
  ].filter((snippet) => !legacyRouteSource.includes(snippet)),
  [],
  "routesUser/NotificationRote.js is missing legacy notification preferences routes"
);

const controllerRequirements = [
  "NotificationModel.find",
  "NotificationModel.updateMany",
  "getOrCreateNotificationPreferences",
  "updateNotificationPreferences",
  "FcmTokenController.registerToken",
  "FcmTokenModel.updateMany",
  "device_token_identifier_required",
];

assert.deepEqual(
  controllerRequirements.filter((snippet) => !controllerSource.includes(snippet)),
  [],
  "NotificationV1Controller.js is missing required notification/device-token behavior"
);

assert.deepEqual(
  [
    "adminNotificationController",
    "notifications.manage",
    "/notifications/send",
  ].filter((snippet) => !dashRouteSource.includes(snippet)),
  [],
  "dashboard routes must expose notifications.manage admin send endpoints"
);

assert.deepEqual(
  [
    "notifyUser",
    "writeAuditLog",
    "admin_notification_sent",
    "notification_recipients_required",
  ].filter((snippet) => !adminControllerSource.includes(snippet)),
  [],
  "adminNotificationController.js must send and audit admin notifications"
);

assert.deepEqual(
  [
    "NotificationPreferenceModel",
    "categoryForNotificationEvent",
    "notificationDeliveryDecision",
    "updateNotificationPreferences",
  ].filter((snippet) => !preferenceServiceSource.includes(snippet)),
  [],
  "notification preferences service must normalize preferences and enforce delivery decisions"
);

assert.ok(
  notificationServiceSource.includes("notificationDeliveryDecision") &&
    notificationServiceSource.includes("push_disabled_by_preferences") &&
    notificationServiceSource.includes("notification_disabled_by_preferences"),
  "notifyUser must enforce notification preferences before saving or pushing"
);

console.log(`Notification route mounts verified (${requiredEndpoints.length} method/path checks).`);
