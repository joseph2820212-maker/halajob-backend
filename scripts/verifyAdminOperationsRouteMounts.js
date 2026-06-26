import assert from "node:assert/strict";
import fs from "node:fs";
import listEndpoints from "express-list-endpoints";
import app from "../app.js";

const endpoints = listEndpoints(app);
const endpointByPath = new Map(endpoints.map((endpoint) => [endpoint.path, endpoint]));
const routeSource = fs.readFileSync(new URL("../routes/index.js", import.meta.url), "utf8");
const controllerSource = fs.readFileSync(new URL("../controllers/dash/adminOperationsController.js", import.meta.url), "utf8");

const requiredEndpoints = [
  ["GET", "/dash/v1/audit-logs", "router.get('/audit-logs'"],
  ["GET", "/dash/v1/operations/audit-logs", "router.get('/operations/audit-logs'"],
  ["GET", "/dash/v1/translations", "router.get('/translations'"],
  ["GET", "/dash/v1/translation-logs", "router.get('/translation-logs'"],
  ["GET", "/dash/v1/notifications/logs", "router.get('/notifications/logs'"],
  ["GET", "/dash/v1/notification-logs", "router.get('/notification-logs'"],
];

const missingEndpoints = requiredEndpoints
  .filter(([method, path]) => !endpointByPath.get(path)?.methods.includes(method))
  .map(([method, path]) => `${method} ${path}`);

assert.deepEqual(missingEndpoints, [], "Express app is missing dashboard operations endpoints");

const adminGuardIndex = routeSource.indexOf("router.use(isAdmin)");
assert.ok(adminGuardIndex >= 0, "Dashboard routes must mount the isAdmin guard");

const unguardedRoutes = requiredEndpoints
  .filter(([, , routeNeedle]) => {
    const routeIndex = routeSource.indexOf(routeNeedle);
    return routeIndex < 0 || routeIndex < adminGuardIndex;
  })
  .map(([, path]) => path);

assert.deepEqual(unguardedRoutes, [], "Dashboard operations endpoints must be declared after isAdmin");

assert.deepEqual(
  [
    "AuditLogModel",
    "ContentTranslationModel",
    "NotificationModel",
    "listAuditLogs",
    "listTranslations",
    "listNotificationLogs",
  ].filter((snippet) => !controllerSource.includes(snippet)),
  [],
  "admin operations controller must read audit, translation, and notification models"
);

console.log(`Admin operations route mounts verified (${requiredEndpoints.length} method/path checks).`);
