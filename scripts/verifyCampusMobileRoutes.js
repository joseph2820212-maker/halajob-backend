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
  careerPassport: readSource("routesUser/CareerPassportRote.js"),
  helper: readSource("routesUser/HelperRote.js"),
  campus: readSource("routesUser/CampusRote.js"),
  campusPublic: readSource("routesCampus/index.js"),
  university: readSource("routesUniversity/index.js"),
  campusController: readSource("controllers/app/campus/campusController.js"),
  companyIndex: readSource("routesCompany/index.js"),
  companyDash: readSource("routesCompany/companyDashRoutes.js"),
  companyJobs: readSource("routesCompany/jobRoute.js"),
  companyCampus: readSource("routesCompany/campusRoute.js"),
  companyHelpers: readSource("helper/companyDash/companyDashHelpers.js"),
  companyMembers: readSource("controllers/companyDash/members/companyMemberController.js"),
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
    "/career-passport",
    "/campus",
  ],
});

assertMounts({
  fileName: "routesEmployee/index.js",
  mounts: declaredMounts(sources.employeeIndex),
  required: ["/global", "/cv"],
});

assertSourceIncludes({
  fileName: "routesCompany/index.js",
  source: sources.companyIndex,
  required: [
    "requireCompanyContext",
    'router.use("/global", authUser, requireCompanyContext, companyDashRoutes)',
    'router.use("/helper", authUser, requireCompanyContext, informationHelperRoute)',
    'router.use("/jobs", authUser, requireCompanyContext, jobRoute)',
    'router.use("/campus", authUser, requireCompanyContext, campusRoute)',
  ],
});

assertSourceIncludes({
  fileName: "routesCompany/companyDashRoutes.js",
  source: sources.companyDash,
  required: [
    'router.get("/subscription/current", requireCompanyPermission("billing.manage")',
    'router.get("/subscription", requireCompanyPermission("billing.manage")',
    'router.get("/subscription/billing-summary", requireCompanyPermission("billing.manage")',
    'router.get("/subscription/invoices", requireCompanyPermission("billing.manage")',
    'router.get("/subscription/invoices/:invoiceId", requireCompanyPermission("billing.manage")',
    'router.post("/subscription/request", requireCompanyPermission("billing.manage")',
    'router.get("/support-tickets", requireCompanyPermission("support.manage")',
    'router.post("/support-tickets", requireCompanyPermission("support.manage")',
    'router.post("/support-tickets/:ticketId/messages", requireCompanyPermission("support.manage")',
    'router.get("/members", requireCompanyPermission("company.members.manage")',
    'router.post("/members", requireCompanyPermission("company.members.manage")',
    'router.patch("/members/:memberId", requireCompanyPermission("company.members.manage")',
    'router.delete("/members/:memberId", requireCompanyPermission("company.members.manage")',
    'router.get("/question-library", requireCompanyPermission("question_library.manage")',
    'router.post("/question-library", requireCompanyPermission("question_library.manage")',
    'router.patch("/question-library/:questionId", requireCompanyPermission("question_library.manage")',
    'router.delete("/question-library/:questionId", requireCompanyPermission("question_library.manage")',
    'router.get("/message-templates", requireCompanyPermission("message_templates.manage")',
    'router.post("/message-templates", requireCompanyPermission("message_templates.manage")',
    'router.patch("/message-templates/:templateId", requireCompanyPermission("message_templates.manage")',
    'router.delete("/message-templates/:templateId", requireCompanyPermission("message_templates.manage")',
  ],
});

assertSourceIncludes({
  fileName: "controllers/companyDash/members/companyMemberController.js",
  source: sources.companyMembers,
  required: [
    'admin: ["company.profile.manage"',
    '"support.manage", "billing.manage"],',
    'hr_manager: ["jobs.manage"',
  ],
});

assertSourceIncludes({
  fileName: "routesCompany/jobRoute.js",
  source: sources.companyJobs,
  required: [
    'router.patch("/hiring/applications/:applicationId/restore", requireCompanyPermission("ats.status.change")',
    'router.post("/hiring/applications/:applicationId/messages", requireCompanyPermission("ats.messages.send")',
    'router.patch("/hiring/applications/:applicationId/block-applicant", requireCompanyPermission("ats.reject")',
    'router.post("/hiring/applications/bulk-cv", requireCompanyPermission("ats.view")',
    'router.post("/hiring/applications/bulk-export", requireCompanyPermission("ats.view")',
    'router.post("/hiring/:jobId/invitations", requireCompanyPermission("ats.messages.send")',
    'router.patch("/hiring/invitations/:invitationId/cancel", requireCompanyPermission("ats.messages.send")',
    'router.post("/talent/:jobId/smart-employees/generate", requireCompanyPermission("ats.view")',
    'router.get("/talent/:jobId/smart-employees", requireCompanyPermission("ats.view")',
    'router.get("/talent/:jobId/employees/:employeeId/match", requireCompanyPermission("ats.view")',
    'router.post("/talent/help-requests", requireCompanyPermission("ats.view")',
    'router.patch("/talent/help-requests/:requestId/cancel", requireCompanyPermission("ats.view")',
  ],
});

assertSourceIncludes({
  fileName: "routesCompany/campusRoute.js",
  source: sources.companyCampus,
  required: [
    'router.get("/overview", requireCompanyPermission("ats.view")',
    'router.get("/opportunities", requireCompanyPermission("jobs.manage")',
    'router.post("/opportunities", requireCompanyPermission("jobs.manage")',
    'router.get("/students", requireCompanyPermission("ats.view")',
    'router.get("/partners", requireCompanyPermission("ats.view")',
    'router.post("/partners", requireCompanyPermission("jobs.manage")',
  ],
});

assertSourceIncludes({
  fileName: "helper/companyDash/companyDashHelpers.js",
  source: sources.companyHelpers,
  required: [
    "const activeContext = req.activeContext || {}",
    '["company_admin", "company_member"].includes(activeContextType)',
    "CompanyModel.findById(activeCompanyId)",
    'fail(res, "company_context_forbidden", 403)',
  ],
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
  fileName: "routesUser/CareerPassportRote.js",
  routes: declaredRoutes(sources.careerPassport),
  required: ["GET /", "PUT /", "POST /share", "GET /share/:token"],
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

assertSourceIncludes({
  fileName: "routesCampus/index.js",
  source: sources.campusPublic,
  required: [
    "requireUniversityAdminContext",
    "const universityAdminGuard = [authUser, requireUniversityAdminContext]",
    'router.get("/admin/verifications", universityAdminGuard',
    'router.post("/admin/verifications/:id/approve", universityAdminGuard',
    'router.post("/admin/verifications/:id/reject", universityAdminGuard',
    'router.post("/admin/verifications/:id/request-info", universityAdminGuard',
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
    "GET /students/:studentId/career-passport",
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
  fileName: "routesUniversity/index.js",
  source: sources.university,
  required: [
    "requireUniversityAdminContext",
    "const universityAdminGuard = [authUser, requireUniversityAdminContext]",
    'router.get("/dashboard", universityAdminGuard',
    'router.get("/dashboard/overview", universityAdminGuard',
    'router.get("/students", universityAdminGuard',
    'router.get("/students/:studentId/career-passport", universityAdminGuard',
    'router.get("/verifications", universityAdminGuard',
    'router.post("/verifications/:id/approve", universityAdminGuard',
    'router.post("/verifications/:id/reject", universityAdminGuard',
    'router.post("/verifications/:id/request-info", universityAdminGuard',
    'router.get("/analytics/employability", universityAdminGuard',
    'router.get("/reports/outcomes", universityAdminGuard',
    'router.get("/opportunities", universityAdminGuard',
    'router.post("/opportunities", universityAdminGuard',
  ],
});

assertSourceIncludes({
  fileName: "controllers/app/campus/campusController.js",
  source: sources.campusController,
  required: [
    'cleanText(req.query?.format).toLowerCase() === "csv"',
    'res.setHeader("Content-Type", "text/csv; charset=utf-8")',
    'res.setHeader("Content-Disposition", \'attachment; filename="university-outcomes.csv"\')',
    'export_formats: ["json", "csv"]',
  ],
});

assertSourceIncludes({
  fileName: "routesUser/CampusRote.js",
  source: sources.campus,
  required: [
    "requireUniversityAdminContext",
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
    'router.get("/admin/verifications", universityAdminGuard',
    'router.post("/admin/verifications/:id/approve", universityAdminGuard',
    'router.post("/admin/verifications/:id/reject", universityAdminGuard',
    'router.post("/admin/verifications/:id/request-info", universityAdminGuard',
    'router.get("/university/overview", universityAdminGuard',
    'router.get("/university/opportunities", universityAdminGuard',
    'router.post("/university/opportunities", universityAdminGuard',
    'router.get("/university/students", universityAdminGuard',
    'router.get("/university/partners", universityAdminGuard',
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
