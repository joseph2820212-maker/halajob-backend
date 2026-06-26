import assert from "node:assert/strict";
import fs from "node:fs";
import listEndpoints from "express-list-endpoints";
import app from "../app.js";

const endpoints = listEndpoints(app);
const endpointByPath = new Map(endpoints.map((endpoint) => [endpoint.path, endpoint]));

const readSource = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const appSource = readSource("app.js");
const routeSource = readSource("routesNotifications/index.js");
const controllerSource = readSource("controllers/app/Notification/NotificationV1Controller.js");

const requiredEndpoints = [
  ["GET", "/notifications/v1"],
  ["GET", "/notifications/v1/list"],
  ["GET", "/notifications/v1/unread-count"],
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
  'router.post("/read"',
  'router.post("/device-token"',
  'router.delete("/device-token"',
];

assert.deepEqual(
  routeRequirements.filter((snippet) => !routeSource.includes(snippet)),
  [],
  "routesNotifications/index.js is missing auth or launch routes"
);

const controllerRequirements = [
  "NotificationModel.find",
  "NotificationModel.updateMany",
  "FcmTokenController.registerToken",
  "FcmTokenModel.updateMany",
  "device_token_identifier_required",
];

assert.deepEqual(
  controllerRequirements.filter((snippet) => !controllerSource.includes(snippet)),
  [],
  "NotificationV1Controller.js is missing required notification/device-token behavior"
);

console.log(`Notification route mounts verified (${requiredEndpoints.length} method/path checks).`);
