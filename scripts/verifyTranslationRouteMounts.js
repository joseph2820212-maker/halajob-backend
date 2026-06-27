import assert from "node:assert/strict";
import fs from "node:fs";
import listEndpoints from "express-list-endpoints";
import app from "../app.js";
import {
  inferSourceLanguage,
  normalizeTranslationLanguage,
} from "../services/translations/contentTranslation.service.js";

const endpoints = listEndpoints(app);
const endpointByPath = new Map(endpoints.map((endpoint) => [endpoint.path, endpoint]));
const readSource = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const appSource = readSource("app.js");
const aiRouteSource = readSource("routesAi/index.js");
const jobRouteSource = readSource("routesJobs/index.js");
const cvRouteSource = readSource("routesUser/CvTranslationRote.js");
const modelSource = readSource("models/ContentTranslationModel.js");
const serviceSource = readSource("services/translations/contentTranslation.service.js");
const jobControllerSource = readSource("controllers/translations/JobTranslationController.js");
const cvControllerSource = readSource("controllers/translations/CvTranslationController.js");

const requiredEndpoints = [
  ["POST", "/ai/v1/translate/job/:jobId"],
  ["POST", "/ai/v1/translate/cv"],
  ["GET", "/jobs/v1/:jobId/translations/:lang"],
  ["PUT", "/jobs/v1/:jobId/translations/:lang"],
  ["GET", "/user/v1/cv/translations/:lang"],
  ["PUT", "/user/v1/cv/translations/:lang"],
];

const missingEndpoints = requiredEndpoints
  .filter(([method, path]) => !endpointByPath.get(path)?.methods.includes(method))
  .map(([method, path]) => `${method} ${path}`);

assert.deepEqual(missingEndpoints, [], "Express app is missing translation endpoints");

assert.ok(appSource.includes('app.use("/ai/v1", aiRoutes)'), "app.js must mount /ai/v1");
assert.ok(appSource.includes('app.use("/jobs/v1", jobsRoutes)'), "app.js must mount /jobs/v1");
assert.ok(appSource.includes('app.use("/user/v1", userRoutes)'), "app.js must mount /user/v1");

assert.deepEqual(
  [
    'router.post("/translate/job/:jobId"',
    'router.post("/translate/cv"',
    'requireAppAccount("company")',
    'requireAppAccount("employee")',
  ].filter((snippet) => !aiRouteSource.includes(snippet)),
  [],
  "routesAi/index.js is missing translation AI route guards"
);

assert.deepEqual(
  [
    'router.get(',
    'router.put(',
    '"/:jobId/translations/:lang"',
    "authUser",
    'requireAppAccount("company")',
    'requireCompanyPermission("jobs.manage")',
  ].filter((snippet) => !jobRouteSource.includes(snippet)),
  [],
  "routesJobs/index.js is missing protected job translation route"
);

assert.deepEqual(
  [
    'router.get(',
    'router.put(',
    '"/translations/:lang"',
    "authUser",
    'requireAppAccount("employee")',
  ].filter((snippet) => !cvRouteSource.includes(snippet)),
  [],
  "routesUser/CvTranslationRote.js is missing protected CV translation route"
);

assert.deepEqual(
  [
    "source_language",
    "target_language",
    "original_text",
    "translated_text",
    "ai_request_id",
    "approval_required",
    "approved_by",
    "approved_at",
    "pending_approval",
    "approved",
  ].filter((snippet) => !modelSource.includes(snippet)),
  [],
  "ContentTranslationModel must preserve translation approval/audit fields"
);

assert.deepEqual(
  [
    "getContentTranslation",
    "approval_required: true",
    'status: resolvedStatus',
    'resolvedStatus === "approved"',
    "approved_by",
    "approved_at",
    "published_translation",
  ].filter((snippet) => !serviceSource.includes(snippet)),
  [],
  "translation service must require explicit approval before publishable status and expose approved reads"
);

assert.ok(
  jobControllerSource.includes('event: "job_translated"') &&
    jobControllerSource.includes("job_translation_approved") &&
    jobControllerSource.includes("job_translation_saved") &&
    jobControllerSource.includes("getJobTranslation") &&
    jobControllerSource.includes("published_translation"),
  "job translation controller must audit, track, and read job translations"
);

assert.ok(
  cvControllerSource.includes('event: "cv_translated"') &&
    cvControllerSource.includes("cv_translation_approved") &&
    cvControllerSource.includes("cv_translation_saved") &&
    cvControllerSource.includes("getCvTranslation") &&
    cvControllerSource.includes("published_translation"),
  "CV translation controller must audit, track, and read CV translations"
);

assert.equal(normalizeTranslationLanguage("AR"), "ar");
assert.equal(normalizeTranslationLanguage(" en "), "en");
assert.equal(inferSourceLanguage("", "ar"), "en");
assert.equal(inferSourceLanguage("", "en"), "ar");
assert.throws(() => normalizeTranslationLanguage("fr"), /unsupported_translation_language/);

console.log(`Translation route mounts verified (${requiredEndpoints.length} method/path checks).`);
