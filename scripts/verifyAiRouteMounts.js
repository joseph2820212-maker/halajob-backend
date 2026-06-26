import assert from "node:assert/strict";
import fs from "node:fs";
import listEndpoints from "express-list-endpoints";
import app from "../app.js";

const endpoints = listEndpoints(app);
const endpointByPath = new Map(endpoints.map((endpoint) => [endpoint.path, endpoint]));
const routeSource = fs.readFileSync(new URL("../routesAi/index.js", import.meta.url), "utf8");
const dashboardRouteSource = fs.readFileSync(new URL("../routes/index.js", import.meta.url), "utf8");

const requiredEndpoints = [
  ["POST", "/ai/v1/career-passport/score", "/career-passport/score", "employee"],
  ["POST", "/ai/v1/career/copilot", "/career/copilot", "employee"],
  ["POST", "/ai/v1/profile/score", "/profile/score", "employee"],
  ["POST", "/ai/v1/cv/rewrite", "/cv/rewrite", "employee"],
  ["POST", "/ai/v1/jobs/:jobId/match", "/jobs/:jobId/match", "employee"],
  ["POST", "/ai/v1/jobs/:jobId/cover-letter", "/jobs/:jobId/cover-letter", "employee"],
  ["POST", "/ai/v1/interview/practice", "/interview/practice", "employee"],
  ["POST", "/ai/v1/company/jobs/generate", "/company/jobs/generate", "company"],
  ["POST", "/ai/v1/company/jobs/:jobId/shortlist", "/company/jobs/:jobId/shortlist", "company"],
  ["POST", "/ai/v1/company/messages/generate", "/company/messages/generate", "company"],
  ["POST", "/ai/v1/translate/job/:jobId", "/translate/job/:jobId", "company"],
  ["POST", "/ai/v1/translate/cv", "/translate/cv", "employee"],
];

const missingEndpoints = requiredEndpoints
  .filter(([method, path]) => !endpointByPath.get(path)?.methods.includes(method))
  .map(([method, path]) => `${method} ${path}`);

assert.deepEqual(missingEndpoints, [], "Express app is missing AI endpoints");

const escapeRegex = (value = "") =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const hasDeclaredAccountGuard = (routePath, accountType) =>
  new RegExp(
    `router\\.post\\(\\s*["']${escapeRegex(routePath)}["']\\s*,\\s*authUser\\s*,\\s*requireAppAccount\\(\\s*["']${accountType}["']`,
    "m"
  ).test(routeSource);

const missingGuards = requiredEndpoints
  .filter(([, path, routePath, accountType]) => {
    const middlewares = endpointByPath.get(path)?.middlewares || [];
    return !middlewares.includes("authUser") || !hasDeclaredAccountGuard(routePath, accountType);
  })
  .map(([, path]) => path);

assert.deepEqual(missingGuards, [], "AI endpoints must require auth and account guards");

const requiredAdminEndpoints = [
  ["GET", "/dash/v1/ai/features", "router.get('/ai/features'"],
  ["GET", "/dash/v1/ai/limits", "router.get('/ai/limits'"],
  ["POST", "/dash/v1/ai/limits", "router.post('/ai/limits'"],
  ["PATCH", "/dash/v1/ai/limits/:id", "router.patch('/ai/limits/:id'"],
  ["DELETE", "/dash/v1/ai/limits/:id", "router.delete('/ai/limits/:id'"],
  ["GET", "/dash/v1/ai/requests", "router.get('/ai/requests'"],
  ["GET", "/dash/v1/ai/requests/:id", "router.get('/ai/requests/:id'"],
  ["GET", "/dash/v1/ai/summary", "router.get('/ai/summary'"],
  ["GET", "/dash/v1/ai/usage/summary", "router.get('/ai/usage/summary'"],
];

const missingAdminEndpoints = requiredAdminEndpoints
  .filter(([method, path]) => !endpointByPath.get(path)?.methods.includes(method))
  .map(([method, path]) => `${method} ${path}`);

assert.deepEqual(missingAdminEndpoints, [], "Express app is missing dashboard AI admin endpoints");

const adminGuardIndex = dashboardRouteSource.indexOf("router.use(isAdmin)");
assert.ok(adminGuardIndex >= 0, "Dashboard routes must mount the isAdmin guard");

const unguardedAdminRoutes = requiredAdminEndpoints
  .filter(([, , routeNeedle]) => {
    const routeIndex = dashboardRouteSource.indexOf(routeNeedle);
    return routeIndex < 0 || routeIndex < adminGuardIndex;
  })
  .map(([, path]) => path);

assert.deepEqual(unguardedAdminRoutes, [], "Dashboard AI admin endpoints must be declared after isAdmin");

console.log(
  `AI route mounts verified (${requiredEndpoints.length} product checks, ${requiredAdminEndpoints.length} admin checks).`
);
