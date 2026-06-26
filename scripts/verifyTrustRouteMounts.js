import assert from "node:assert/strict";
import fs from "node:fs";
import listEndpoints from "express-list-endpoints";
import app from "../app.js";

const endpoints = listEndpoints(app);
const endpointByPath = new Map(endpoints.map((endpoint) => [endpoint.path, endpoint]));

const readSource = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const appSource = readSource("app.js");
const trustSource = readSource("routesTrust/index.js");
const trustAdminSource = readSource("routesTrust/admin.js");
const trustAdminControllerSource = readSource("controllers/trust/TrustAdminController.js");
const dashSource = readSource("routes/index.js");

const requiredEndpoints = [
  ["POST", "/trust/v1/jobs/:jobId/score"],
  ["POST", "/trust/v1/jobs/:jobId/report"],
  ["GET", "/admin/v1/trust/review-queue"],
  ["POST", "/admin/v1/trust/jobs/:jobId/mark-safe"],
  ["PATCH", "/admin/v1/trust/jobs/:jobId/mark-safe"],
  ["POST", "/admin/v1/trust/jobs/:jobId/suspend"],
  ["PATCH", "/admin/v1/trust/jobs/:jobId/suspend"],
  ["POST", "/admin/v1/trust/jobs/:jobId/request-documents"],
  ["PATCH", "/admin/v1/trust/jobs/:jobId/request-documents"],
  ["GET", "/dash/v1/trust/review-queue"],
  ["POST", "/dash/v1/trust/jobs/:jobId/mark-safe"],
  ["PATCH", "/dash/v1/trust/jobs/:jobId/mark-safe"],
  ["POST", "/dash/v1/trust/jobs/:jobId/suspend"],
  ["PATCH", "/dash/v1/trust/jobs/:jobId/suspend"],
  ["POST", "/dash/v1/trust/jobs/:jobId/request-documents"],
  ["PATCH", "/dash/v1/trust/jobs/:jobId/request-documents"],
];

const missingEndpoints = requiredEndpoints
  .filter(([method, path]) => !endpointByPath.get(path)?.methods.includes(method))
  .map(([method, path]) => `${method} ${path}`);

assert.deepEqual(missingEndpoints, [], "Express app is missing trust endpoints");

const requiredMounts = [
  'app.use("/trust/v1", trustRoutes)',
  'app.use("/admin/v1/trust", trustAdminRoutes)',
];

assert.deepEqual(
  requiredMounts.filter((snippet) => !appSource.includes(snippet)),
  [],
  "app.js is missing trust route mounts"
);

const requiredTrustGuards = [
  'authUser',
  'requireAppAccount("employee")',
  'router.post(\n  "/jobs/:jobId/score"',
  'router.post(\n  "/jobs/:jobId/report"',
];

assert.deepEqual(
  requiredTrustGuards.filter((snippet) => !trustSource.includes(snippet)),
  [],
  "routesTrust/index.js is missing seeker trust guards"
);

const requiredAdminGuards = [
  "router.use(isAdmin)",
  'router.get("/review-queue"',
  'router.post("/jobs/:jobId/mark-safe"',
  'router.post("/jobs/:jobId/suspend"',
  'router.post("/jobs/:jobId/request-documents"',
];

assert.deepEqual(
  requiredAdminGuards.filter((snippet) => !trustAdminSource.includes(snippet)),
  [],
  "routesTrust/admin.js is missing admin trust guards"
);

const requiredDashRoutes = [
  "router.use(isAdmin)",
  "TrustAdminController",
  "router.get('/trust/review-queue'",
  "router.post('/trust/jobs/:jobId/mark-safe'",
  "router.post('/trust/jobs/:jobId/suspend'",
  "router.post('/trust/jobs/:jobId/request-documents'",
];

assert.deepEqual(
  requiredDashRoutes.filter((snippet) => !dashSource.includes(snippet)),
  [],
  "routes/index.js is missing dashboard trust aliases"
);

const requiredAdminAnalytics = [
  "recordAnalyticsEvent",
  'event: "job_trust_marked_safe"',
  'event: "job_trust_suspended"',
  'event: "job_trust_documents_requested"',
  'source: "trust_admin_review"',
];

assert.deepEqual(
  requiredAdminAnalytics.filter((snippet) => !trustAdminControllerSource.includes(snippet)),
  [],
  "TrustAdminController.js is missing admin trust analytics hooks"
);

console.log(`Trust route mounts verified (${requiredEndpoints.length} method/path checks).`);
