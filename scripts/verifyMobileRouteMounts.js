import assert from "node:assert/strict";
import listEndpoints from "express-list-endpoints";
import app from "../app.js";

const endpoints = listEndpoints(app);
const endpointByPath = new Map(endpoints.map((endpoint) => [endpoint.path, endpoint]));

const requiredEndpoints = [
  ["POST", "/user/v1/auth/register"],
  ["POST", "/user/v1/auth/campus/register"],
  ["POST", "/user/v1/auth/login"],
  ["POST", "/user/v1/auth/logout"],
  ["POST", "/user/v1/auth/passcode-verify"],
  ["POST", "/user/v1/auth/forgot-password"],
  ["POST", "/user/v1/auth/passcode-forgot-password"],
  ["POST", "/user/v1/auth/resetPassword"],
  ["POST", "/user/v1/auth/update-profile"],

  ["GET", "/user/v1/me/contexts"],
  ["POST", "/user/v1/me/active-context"],
  ["GET", "/user/v1/me/permissions"],

  ["GET", "/user/v1/career-passport"],
  ["PUT", "/user/v1/career-passport"],
  ["POST", "/user/v1/career-passport/share"],
  ["POST", "/ai/v1/career-passport/score"],

  ["GET", "/campus/v1/universities"],
  ["GET", "/campus/v1/universities/:id/campuses"],
  ["GET", "/campus/v1/student-verifications/me"],
  ["POST", "/campus/v1/student-verifications"],
  ["POST", "/campus/v1/student-verifications/:id/resubmit"],
  ["POST", "/campus/v1/verification/start"],
  ["POST", "/campus/v1/verification/confirm-email"],
  ["POST", "/campus/v1/verification/upload-document"],
  ["GET", "/campus/v1/admin/verifications"],
  ["POST", "/campus/v1/admin/verifications/:id/approve"],
  ["POST", "/campus/v1/admin/verifications/:id/reject"],
  ["POST", "/campus/v1/admin/verifications/:id/request-info"],

  ["GET", "/user/v1/helper/languages"],
  ["GET", "/user/v1/helper/work-mode"],
  ["GET", "/user/v1/helper/job-types"],
  ["GET", "/user/v1/helper/job-time"],
  ["GET", "/user/v1/helper/cities"],
  ["GET", "/user/v1/helper/countries"],

  ["GET", "/user/v1/job/get"],
  ["GET", "/user/v1/job/get-by-id/:id"],
  ["POST", "/user/v1/job-information/apply-outside/:id"],
  ["POST", "/user/v1/job-information/toggle-save-job/:id"],
  ["POST", "/user/v1/job-information/rate-job/:id"],
  ["POST", "/user/v1/job-information/review-job/:id"],
  ["POST", "/user/v1/job-information/report-job/:id"],
  ["GET", "/user/v1/applying-job/get"],
  ["GET", "/user/v1/applying-job/readiness/:id"],
  ["POST", "/user/v1/applying-job/insert/:id"],
  ["GET", "/user/v1/app/dashboard/overview"],

  ["GET", "/user/v1/notifications"],
  ["GET", "/user/v1/notifications/get"],
  ["POST", "/user/v1/notifications/read-all"],
  ["PATCH", "/user/v1/notifications/read-all"],
  ["POST", "/user/v1/notifications/:id/read"],
  ["PATCH", "/user/v1/notifications/:id/read"],
  ["DELETE", "/user/v1/notifications/:id"],
  ["POST", "/user/v1/notifications/:id/delete"],

  ["GET", "/user/v1/fcm/tokens"],
  ["POST", "/user/v1/fcm/tokens"],
  ["POST", "/user/v1/fcm/update-tokens/:id"],
  ["POST", "/user/v1/fcm/delete-tokens/:id"],

  ["GET", "/user/v1/campus/dashboard"],
  ["GET", "/user/v1/campus/dashboard/overview"],
  ["GET", "/user/v1/campus/overview"],
  ["GET", "/user/v1/campus/content"],
  ["GET", "/user/v1/campus/events"],
  ["GET", "/user/v1/campus/resources"],
  ["GET", "/user/v1/campus/universities"],
  ["GET", "/user/v1/campus/universities/:id/campuses"],
  ["GET", "/user/v1/campus/student-verifications/me"],
  ["POST", "/user/v1/campus/student-verifications"],
  ["POST", "/user/v1/campus/student-verifications/:id/resubmit"],
  ["POST", "/user/v1/campus/verification/start"],
  ["POST", "/user/v1/campus/verification/confirm-email"],
  ["POST", "/user/v1/campus/verification/upload-document"],
  ["GET", "/user/v1/campus/admin/verifications"],
  ["POST", "/user/v1/campus/admin/verifications/:id/approve"],
  ["POST", "/user/v1/campus/admin/verifications/:id/reject"],
  ["POST", "/user/v1/campus/admin/verifications/:id/request-info"],
  ["GET", "/user/v1/campus/profile"],
  ["POST", "/user/v1/campus/profile"],
  ["PUT", "/user/v1/campus/profile"],
  ["PATCH", "/user/v1/campus/profile"],
  ["GET", "/user/v1/campus/opportunities"],
  ["GET", "/user/v1/campus/opportunities/:id"],
  ["GET", "/user/v1/campus/opportunities/:id/readiness"],
  ["POST", "/user/v1/campus/opportunities/:id/apply"],
  ["POST", "/user/v1/campus/opportunities/:id/apply-external"],
  ["POST", "/user/v1/campus/opportunities/:id/save"],
  ["DELETE", "/user/v1/campus/opportunities/:id/save"],
  ["POST", "/user/v1/campus/opportunities/:id/toggle-save"],
  ["GET", "/user/v1/campus/applications"],
  ["GET", "/user/v1/campus/applications/:id"],
  ["POST", "/user/v1/campus/applications/:id/messages"],
  ["PATCH", "/user/v1/campus/applications/:id/cancel"],
  ["POST", "/user/v1/campus/applications/:id/cancel"],
  ["POST", "/user/v1/campus/events/:eventId/register"],
  ["PATCH", "/user/v1/campus/events/:eventId/cancel"],
  ["POST", "/user/v1/campus/events/:eventId/cancel"],

  ["GET", "/employee/v1/global/jobs"],
  ["GET", "/employee/v1/global/jobs/recommended"],
  ["GET", "/employee/v1/global/jobs/saved"],
  ["GET", "/employee/v1/global/jobs/:jobId"],
  ["POST", "/employee/v1/global/jobs/:jobId/apply"],
  ["POST", "/employee/v1/global/jobs/:jobId/save"],
  ["DELETE", "/employee/v1/global/jobs/:jobId/save"],
  ["POST", "/employee/v1/global/jobs/:jobId/rate"],
  ["POST", "/employee/v1/global/jobs/:jobId/review"],
  ["GET", "/employee/v1/global/applications"],
  ["GET", "/employee/v1/global/applications/interviews"],
  ["PATCH", "/employee/v1/global/applications/interviews/:interviewId/respond"],
  ["GET", "/employee/v1/global/applications/offers"],
  ["PATCH", "/employee/v1/global/applications/offers/:invitationId/respond"],
  ["GET", "/employee/v1/global/applications/:applicationId"],
  ["POST", "/employee/v1/global/applications/:applicationId/messages"],
  ["PATCH", "/employee/v1/global/applications/:applicationId/cancel"],
  ["GET", "/employee/v1/global/companies"],
  ["GET", "/employee/v1/global/companies/activity"],
  ["GET", "/employee/v1/global/companies/applied"],
  ["GET", "/employee/v1/global/companies/saved-jobs"],
  ["GET", "/employee/v1/global/companies/viewed"],
  ["GET", "/employee/v1/global/companies/:companyId"],
  ["POST", "/employee/v1/global/companies/:companyId/review"],
  ["GET", "/employee/v1/global/profile"],
  ["PUT", "/employee/v1/global/profile"],
  ["PUT", "/employee/v1/global/profile/about-me"],
  ["PUT", "/employee/v1/global/profile/work-preferences"],
  ["GET", "/employee/v1/global/profile/:section"],
  ["PUT", "/employee/v1/global/profile/:section"],
  ["POST", "/employee/v1/global/profile/:section"],
  ["PATCH", "/employee/v1/global/profile/:section/:itemId"],
  ["DELETE", "/employee/v1/global/profile/:section/:itemId"],

  ["GET", "/employee/v1/cv/uploaded"],
  ["POST", "/employee/v1/cv/upload"],
  ["PUT", "/employee/v1/cv/upload/:cvId"],
  ["DELETE", "/employee/v1/cv/uploaded/:cvId"],
  ["GET", "/employee/v1/cv/generate/templates"],
  ["POST", "/employee/v1/cv/generate/download-url"],
];

const requiredCampusStudentPaths = [
  "/user/v1/campus/dashboard",
  "/user/v1/campus/dashboard/overview",
  "/user/v1/campus/overview",
  "/user/v1/campus/content",
  "/user/v1/campus/events",
  "/user/v1/campus/resources",
  "/user/v1/campus/profile",
  "/user/v1/campus/opportunities",
  "/user/v1/campus/opportunities/:id",
  "/user/v1/campus/opportunities/:id/readiness",
  "/user/v1/campus/opportunities/:id/apply",
  "/user/v1/campus/opportunities/:id/apply-external",
  "/user/v1/campus/opportunities/:id/save",
  "/user/v1/campus/opportunities/:id/toggle-save",
  "/user/v1/campus/applications",
  "/user/v1/campus/applications/:id",
  "/user/v1/campus/applications/:id/messages",
  "/user/v1/campus/applications/:id/cancel",
  "/user/v1/campus/events/:eventId/register",
  "/user/v1/campus/events/:eventId/cancel",
];

function hasEndpoint(method, path) {
  return endpointByPath.get(path)?.methods.includes(method) === true;
}

const missingEndpoints = requiredEndpoints
  .filter(([method, path]) => !hasEndpoint(method, path))
  .map(([method, path]) => `${method} ${path}`);

assert.deepEqual(missingEndpoints, [], "Express app is missing mobile endpoints");

const missingCampusGuards = requiredCampusStudentPaths.filter((path) => {
  const middlewares = endpointByPath.get(path)?.middlewares || [];
  return !middlewares.includes("authUser") || !middlewares.includes("requireCampusStudent");
});

assert.deepEqual(missingCampusGuards, [], "Campus mobile endpoints must require a signed-in campus student");

console.log(`Mobile route mounts verified (${requiredEndpoints.length} method/path checks).`);
