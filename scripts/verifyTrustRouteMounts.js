import assert from "node:assert/strict";
import fs from "node:fs";
import listEndpoints from "express-list-endpoints";
import app from "../app.js";

const endpoints = listEndpoints(app);
const endpointByPath = new Map(endpoints.map((endpoint) => [endpoint.path, endpoint]));

const readSource = (path) =>
  fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const escapeRegex = (value = "") =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const appSource = readSource("app.js");
const trustSource = readSource("routesTrust/index.js");
const trustAdminSource = readSource("routesTrust/admin.js");
const trustControllerSource = readSource("controllers/trust/TrustController.js");
const trustAdminControllerSource = readSource("controllers/trust/TrustAdminController.js");
const dashSource = readSource("routes/index.js");
const webAdminSource = readSource("web/src/admin/screens.tsx");
const webApiSource = readSource("web/src/shared/api.ts");

const requiredEndpoints = [
  ["POST", "/trust/v1/jobs/:jobId/score"],
  ["POST", "/trust/v1/jobs/:jobId/report"],
  ["POST", "/trust/v1/jobs/:jobId/documents"],
  ["PATCH", "/trust/v1/jobs/:jobId/documents"],
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
  'requireAppAccount("company")',
  'router.post(\n  "/jobs/:jobId/score"',
  'router.post(\n  "/jobs/:jobId/report"',
  'router.post(\n  "/jobs/:jobId/documents"',
  'router.patch(\n  "/jobs/:jobId/documents"',
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

const dashAdminGuardIndex = dashSource.indexOf("router.use(isAdmin)");
assert.ok(dashAdminGuardIndex >= 0, "routes/index.js is missing dashboard isAdmin guard");
assert.ok(dashSource.includes("TrustAdminController"), "routes/index.js is missing TrustAdminController import/use");

const requiredDashRoutes = [
  ["GET", "/trust/review-queue"],
  ["POST", "/trust/jobs/:jobId/mark-safe"],
  ["PATCH", "/trust/jobs/:jobId/mark-safe"],
  ["POST", "/trust/jobs/:jobId/suspend"],
  ["PATCH", "/trust/jobs/:jobId/suspend"],
  ["POST", "/trust/jobs/:jobId/request-documents"],
  ["PATCH", "/trust/jobs/:jobId/request-documents"],
];

const dashRouteIndex = (method, routePath) =>
  dashSource.search(
    new RegExp(
      `router\\.${method.toLowerCase()}\\(\\s*["']${escapeRegex(routePath)}["']`,
      "m"
    )
  );

assert.deepEqual(
  requiredDashRoutes
    .filter(([method, routePath]) => {
      const routeIndex = dashRouteIndex(method, routePath);
      return routeIndex < 0 || routeIndex < dashAdminGuardIndex;
    })
    .map(([method, routePath]) => `${method} ${routePath}`),
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

const requiredCompanyTrustAnalytics = [
  "submitJobDocuments",
  'event: "job_trust_documents_submitted"',
  'source: "company_trust_response"',
  "trust_job_documents_submitted",
];

assert.deepEqual(
  requiredCompanyTrustAnalytics.filter((snippet) => !trustControllerSource.includes(snippet)),
  [],
  "TrustController.js is missing company trust document analytics/audit hooks"
);

const requiredWebTrustReview = [
  "trustReviewQueue",
  "trustMarkSafe",
  "trustSuspend",
  "trustRequestDocuments",
  "submitTrustDocuments",
  '"/dash/v1/trust/review-queue"',
  '`/dash/v1/trust/jobs/${pathSegment(id)}/mark-safe`',
  '`/dash/v1/trust/jobs/${pathSegment(id)}/suspend`',
  '`/dash/v1/trust/jobs/${pathSegment(id)}/request-documents`',
  '`/trust/v1/jobs/${pathSegment(id)}/documents`',
].filter((snippet) => !webApiSource.includes(snippet));

assert.deepEqual(requiredWebTrustReview, [], "web/src/shared/api.ts is missing admin trust review calls");

const requiredWebTrustScreen = [
  "adminService.trustReviewQueue",
  '"trust"',
  '"Trust review"',
  '"Mark safe"',
  '"Suspend job"',
  '"Request documents"',
].filter((snippet) => !webAdminSource.includes(snippet));

assert.deepEqual(requiredWebTrustScreen, [], "web/src/admin/screens.tsx is missing admin trust review UI");

console.log(`Trust route mounts verified (${requiredEndpoints.length} method/path checks).`);
