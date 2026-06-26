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
    "adminSummary",
    "adminCohorts",
    "analytics_admin_context_required",
  ].filter((snippet) => !analyticsControllerSource.includes(snippet)),
  [],
  "AnalyticsController.js is missing guarded admin analytics reports"
);

assert.equal(analyticsGroupForEvent("job_reported"), "jobs");
assert.equal(analyticsGroupForEvent("ai_copilot_used"), "ai");
assert.equal(analyticsGroupForEvent("ai_shortlist_generated"), "ai");
assert.equal(analyticsGroupForEvent("ai_job_draft_generated"), "ai");
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

console.log(`Analytics route mounts verified (${requiredEndpoints.length} method/path checks).`);
