import assert from "node:assert/strict";
import fs from "node:fs";

function readSource(path) {
  return fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

const sources = {
  app: readSource("app.js"),
  userIndex: readSource("routesUser/index.js"),
  employeeIndex: readSource("routesEmployee/index.js"),
  auth: readSource("routesUser/AuthRote.js"),
  userOverview: readSource("routesUser/AppUserOverviewRote.js"),
  employeeProfile: readSource("routesUser/EmployeeRote.js"),
  job: readSource("routesUser/JobRote.js"),
  applyingJob: readSource("routesUser/ApplyingJobRote.js"),
  jobInformation: readSource("routesUser/JobInformationRote.js"),
  companyRequest: readSource("routesUser/CompanyRote.js"),
  notification: readSource("routesUser/NotificationRote.js"),
  fcm: readSource("routesUser/FcmRote.js"),
  helper: readSource("routesUser/HelperRote.js"),
  campus: readSource("routesUser/CampusRote.js"),
  campusPublic: readSource("routesCampus/index.js"),
  university: readSource("routesUniversity/index.js"),
  employeeDash: readSource("routesEmployee/employeeDashRoutes.js"),
  employeeCv: readSource("routesEmployee/cvRoute.js"),
};

function declaredRoutes(source) {
  const routes = new Set();
  const routePattern = /router\.(get|post|patch|delete|put)\(\s*["'`]([^"'`]+)["'`]/g;
  let match;

  while ((match = routePattern.exec(source)) !== null) {
    routes.add(`${match[1].toUpperCase()} ${match[2]}`);
  }

  return routes;
}

function declaredMounts(source, caller = "router") {
  const mounts = new Set();
  const mountPattern = new RegExp(`${caller}\\.use\\(\\s*["'\`]([^"'\`]+)["'\`]`, "g");
  let match;

  while ((match = mountPattern.exec(source)) !== null) {
    mounts.add(match[1]);
  }

  return mounts;
}

function assertRoutes({ fileName, routes, required }) {
  const missing = required.filter((route) => !routes.has(route));
  assert.deepEqual(missing, [], `${fileName} is missing mobile contract routes`);
}

function assertMounts({ fileName, mounts, required }) {
  const missing = required.filter((mount) => !mounts.has(mount));
  assert.deepEqual(missing, [], `${fileName} is missing mobile route mounts`);
}

function assertSourceIncludes({ fileName, source, required }) {
  const missing = required.filter((snippet) => !source.includes(snippet));
  assert.deepEqual(missing, [], `${fileName} is missing required mobile route source`);
}

assertMounts({
  fileName: "app.js",
  mounts: declaredMounts(sources.app, "app"),
  required: ["/user/v1", "/employee/v1", "/campus/v1", "/university/v1"],
});

assertMounts({
  fileName: "routesUser/index.js",
  mounts: declaredMounts(sources.userIndex),
  required: [
    "/auth",
    "/helper",
    "/job",
    "/employee",
    "/company",
    "/job-information",
    "/applying-job",
    "/app/dashboard",
    "/notifications",
    "/fcm",
    "/campus",
  ],
});

assertMounts({
  fileName: "routesEmployee/index.js",
  mounts: declaredMounts(sources.employeeIndex),
  required: ["/global", "/cv"],
});

assertRoutes({
  fileName: "routesUser/AuthRote.js",
  routes: declaredRoutes(sources.auth),
  required: [
    "POST /register",
    "POST /campus/register",
    "POST /login",
    "POST /logout",
    "POST /passcode-verify",
    "POST /forgot-password",
    "POST /passcode-forgot-password",
    "POST /resetPassword",
    "POST /update-profile",
  ],
});

assertRoutes({
  fileName: "routesUser/AppUserOverviewRote.js",
  routes: declaredRoutes(sources.userOverview),
  required: ["GET /", "GET /overview"],
});

assertRoutes({
  fileName: "routesUser/EmployeeRote.js",
  routes: declaredRoutes(sources.employeeProfile),
  required: ["GET /profile-get", "POST /profile-update"],
});

assertRoutes({
  fileName: "routesUser/JobRote.js",
  routes: declaredRoutes(sources.job),
  required: ["GET /get", "GET /get-by-id/:id"],
});

assertRoutes({
  fileName: "routesUser/ApplyingJobRote.js",
  routes: declaredRoutes(sources.applyingJob),
  required: ["GET /get", "GET /readiness/:id", "POST /insert/:id"],
});

assertRoutes({
  fileName: "routesUser/JobInformationRote.js",
  routes: declaredRoutes(sources.jobInformation),
  required: [
    "POST /apply-outside/:id",
    "POST /toggle-save-job/:id",
    "POST /rate-job/:id",
    "POST /review-job/:id",
    "POST /report-job/:id",
  ],
});

assertRoutes({
  fileName: "routesUser/CompanyRote.js",
  routes: declaredRoutes(sources.companyRequest),
  required: [
    "POST /join-request",
    "POST /upload-file",
    "POST /delete-file",
    "GET /get-files",
  ],
});

assertRoutes({
  fileName: "routesUser/NotificationRote.js",
  routes: declaredRoutes(sources.notification),
  required: [
    "GET /",
    "GET /get",
    "GET /unread-count",
    "POST /read-all",
    "PATCH /read-all",
    "POST /:id/read",
    "PATCH /:id/read",
    "DELETE /:id",
    "POST /:id/delete",
  ],
});

assertRoutes({
  fileName: "routesUser/FcmRote.js",
  routes: declaredRoutes(sources.fcm),
  required: [
    "GET /tokens",
    "POST /tokens",
    "POST /update-tokens/:id",
    "POST /delete-tokens/:id",
  ],
});

assertRoutes({
  fileName: "routesUser/HelperRote.js",
  routes: declaredRoutes(sources.helper),
  required: ["GET /languages", "GET /work-mode", "GET /job-types", "GET /cities"],
});

assertRoutes({
  fileName: "routesUser/CampusRote.js",
  routes: declaredRoutes(sources.campus),
  required: [
    "GET /profile",
    "POST /profile",
    "PATCH /profile",
    "GET /dashboard",
    "GET /dashboard/overview",
    "GET /content",
    "GET /events",
    "GET /resources",
    "GET /overview",
    "GET /universities",
    "GET /universities/:id/campuses",
    "GET /student-verifications/me",
    "POST /student-verifications",
    "POST /student-verifications/:id/resubmit",
    "POST /verification/start",
    "POST /verification/confirm-email",
    "POST /verification/upload-document",
    "GET /admin/verifications",
    "POST /admin/verifications/:id/approve",
    "POST /admin/verifications/:id/reject",
    "POST /admin/verifications/:id/request-info",
    "POST /events/:eventId/register",
    "PATCH /events/:eventId/cancel",
    "POST /events/:eventId/cancel",
    "GET /opportunities",
    "GET /opportunities/:id/readiness",
    "GET /opportunities/:id",
    "POST /opportunities/:id/apply",
    "POST /opportunities/:id/apply-external",
    "POST /opportunities/:id/save",
    "DELETE /opportunities/:id/save",
    "POST /opportunities/:id/toggle-save",
    "GET /applications",
    "GET /applications/:id",
    "POST /applications/:id/messages",
    "PATCH /applications/:id/cancel",
    "POST /applications/:id/cancel",
  ],
});

assertRoutes({
  fileName: "routesCampus/index.js",
  routes: declaredRoutes(sources.campusPublic),
  required: [
    "GET /universities",
    "GET /universities/:id/campuses",
    "GET /student-verifications/me",
    "POST /student-verifications",
    "POST /student-verifications/:id/resubmit",
    "POST /verification/start",
    "POST /verification/confirm-email",
    "POST /verification/upload-document",
    "GET /admin/verifications",
    "POST /admin/verifications/:id/approve",
    "POST /admin/verifications/:id/reject",
    "POST /admin/verifications/:id/request-info",
  ],
});

assertRoutes({
  fileName: "routesUniversity/index.js",
  routes: declaredRoutes(sources.university),
  required: [
    "GET /dashboard",
    "GET /dashboard/overview",
    "GET /overview",
    "GET /students",
    "GET /verifications",
    "POST /verifications/:id/approve",
    "POST /verifications/:id/reject",
    "POST /verifications/:id/request-info",
    "GET /analytics/employability",
    "GET /reports/outcomes",
    "GET /partners",
    "GET /employer-partners",
    "GET /opportunities",
    "POST /opportunities",
  ],
});

assertSourceIncludes({
  fileName: "routesUser/CampusRote.js",
  source: sources.campus,
  required: [
    'router.get("/profile", campusMobileGuard',
    'router.post("/profile", campusMobileGuard',
    'router.put("/profile", campusMobileGuard',
    'router.patch("/profile", campusMobileGuard',
    'router.get("/events", campusMobileGuard',
    'router.get("/resources", campusMobileGuard',
    'router.get("/overview", campusMobileGuard',
    'router.post("/events/:eventId/register", campusMobileGuard',
    'router.patch("/events/:eventId/cancel", campusMobileGuard',
    'router.post("/events/:eventId/cancel", campusMobileGuard',
  ],
});

assertRoutes({
  fileName: "routesEmployee/employeeDashRoutes.js",
  routes: declaredRoutes(sources.employeeDash),
  required: [
    "GET /jobs",
    "GET /jobs/recommended",
    "GET /jobs/saved",
    "GET /jobs/:jobId",
    "POST /jobs/:jobId/apply",
    "POST /jobs/:jobId/save",
    "DELETE /jobs/:jobId/save",
    "POST /jobs/:jobId/rate",
    "POST /jobs/:jobId/review",
    "GET /applications",
    "GET /applications/interviews",
    "PATCH /applications/interviews/:interviewId/respond",
    "GET /applications/offers",
    "PATCH /applications/offers/:invitationId/respond",
    "GET /applications/:applicationId",
    "POST /applications/:applicationId/messages",
    "PATCH /applications/:applicationId/cancel",
    "GET /companies",
    "GET /companies/activity",
    "GET /companies/applied",
    "GET /companies/saved-jobs",
    "GET /companies/viewed",
    "GET /companies/:companyId",
    "POST /companies/:companyId/review",
  ],
});

assertRoutes({
  fileName: "routesEmployee/cvRoute.js",
  routes: declaredRoutes(sources.employeeCv),
  required: [
    "POST /upload",
    "PUT /upload/:cvId",
    "GET /uploaded",
    "DELETE /uploaded/:cvId",
    "GET /generate/templates",
    "POST /generate/download-url",
  ],
});

console.log("Mobile route contract verified.");
