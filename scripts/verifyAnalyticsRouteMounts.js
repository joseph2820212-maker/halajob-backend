import assert from "node:assert/strict";
import fs from "node:fs";
import listEndpoints from "express-list-endpoints";
import app from "../app.js";
import {
  ANALYTICS_EVENT_GROUPS,
  analyticsGroupForEvent,
  assertSupportedAnalyticsEvent,
} from "../services/analytics/analyticsEvent.service.js";

const endpoints = listEndpoints(app);
const endpointByPath = new Map(endpoints.map((endpoint) => [endpoint.path, endpoint]));
const readSource = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const appSource = readSource("app.js");
const routeSource = readSource("routesAnalytics/index.js");
const trustSource = readSource("controllers/trust/TrustController.js");
const webAdminSource = readSource("web/src/admin/screens.tsx");
const webApiSource = readSource("web/src/shared/api.ts");

const requiredEndpoints = [
  ["POST", "/analytics/v1/events"],
  ["POST", "/analytics/v1/track"],
  ["GET", "/analytics/v1/events"],
  ["GET", "/analytics/v1/admin/summary"],
  ["GET", "/analytics/v1/admin/cohorts"],
];

const missingEndpoints = requiredEndpoints
  .filter(([method, path]) => !endpointByPath.get(path)?.methods.includes(method))
  .map(([method, path]) => `${method} ${path}`);

assert.deepEqual(missingEndpoints, [], "Express app is missing analytics endpoints");

assert.ok(
  appSource.includes('app.use("/analytics/v1", analyticsRoutes)'),
  "app.js must mount /analytics/v1"
);

assert.deepEqual(
  [
    "router.use(authUser)",
    'router.post("/events"',
    'router.post("/track"',
    'router.get("/events"',
    'router.get("/admin/summary"',
    'router.get("/admin/cohorts"',
  ].filter((snippet) => !routeSource.includes(snippet)),
  [],
  "routesAnalytics/index.js is missing auth or event routes"
);

const analyticsControllerSource = readSource("controllers/analytics/AnalyticsController.js");
assert.deepEqual(
  [
    "requireAnalyticsReportContext",
    'context_type === "super_admin"',
    'context_type === "university_admin"',
    "scopeFilter",
    '"metadata.university_id"',
    "adminSummary",
    "adminCohorts",
    "reportDateFilter",
    "reportQueryFilter",
    "if (query.group)",
    "if (query.event)",
    "if (query.context_type)",
    "if (query.company_id)",
    "totals",
    "by_group",
    "by_event",
    "by_context_type",
    "daily",
    "by_context_group",
    "by_context_event",
    "by_platform",
    "by_app_version",
    "analytics_admin_context_required",
  ].filter((snippet) => !analyticsControllerSource.includes(snippet)),
  [],
  "AnalyticsController.js is missing guarded admin analytics reports"
);

assert.equal(analyticsGroupForEvent("job_reported"), "jobs");
assert.equal(analyticsGroupForEvent("job_trust_marked_safe"), "jobs");
assert.equal(analyticsGroupForEvent("job_trust_suspended"), "jobs");
assert.equal(analyticsGroupForEvent("job_trust_documents_requested"), "jobs");
assert.equal(analyticsGroupForEvent("job_trust_documents_submitted"), "jobs");
assert.equal(analyticsGroupForEvent("notification_opened"), "activation");
assert.equal(analyticsGroupForEvent("career_passport_updated"), "activation");
assert.equal(analyticsGroupForEvent("career_passport_share_enabled"), "activation");
assert.equal(analyticsGroupForEvent("career_passport_share_revoked"), "activation");
assert.equal(analyticsGroupForEvent("ai_copilot_used"), "ai");
assert.equal(analyticsGroupForEvent("ai_shortlist_generated"), "ai");
assert.equal(analyticsGroupForEvent("ai_job_draft_generated"), "ai");
assert.equal(analyticsGroupForEvent("ai_job_translation_generated"), "ai");
assert.equal(analyticsGroupForEvent("ai_cv_translation_generated"), "ai");
assert.equal(analyticsGroupForEvent("event_joined"), "campus");
assert.deepEqual(Object.keys(ANALYTICS_EVENT_GROUPS), [
  "activation",
  "ai",
  "jobs",
  "company",
  "campus",
  "global",
]);

assert.doesNotThrow(() => assertSupportedAnalyticsEvent("currency_selected", "global"));
assert.throws(
  () => assertSupportedAnalyticsEvent("currency_selected", "jobs"),
  /analytics_event_group_mismatch/
);
assert.throws(
  () => assertSupportedAnalyticsEvent("unknown_event"),
  /unsupported_analytics_event/
);

assert.ok(
  trustSource.includes('event: "job_reported"') && trustSource.includes("recordAnalyticsEvent"),
  "trust report controller must record job_reported analytics"
);

assert.deepEqual(
  [
    "analyticsSummary",
    "analyticsCohorts",
    '"/analytics/v1/admin/summary"',
    '"/analytics/v1/admin/cohorts"',
  ].filter((snippet) => !webApiSource.includes(snippet)),
  [],
  "web/src/shared/api.ts is missing admin analytics report calls"
);

assert.deepEqual(
  [
    "AdminAnalyticsPanel",
    '"analytics"',
    '"Analytics reports"',
    "adminService.analyticsSummary",
    "adminService.analyticsCohorts",
    '"Events by group"',
    '"Top events"',
    '"Context events"',
  ].filter((snippet) => !webAdminSource.includes(snippet)),
  [],
  "web/src/admin/screens.tsx is missing admin analytics report UI"
);

console.log(`Analytics route mounts verified (${requiredEndpoints.length} method/path checks).`);
