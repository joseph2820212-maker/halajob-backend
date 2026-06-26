import assert from "node:assert/strict";
import fs from "node:fs";
import {
  EVENT_ROUTE,
  NOTIFICATION_TEXT,
  renderNotificationText,
  routeForEvent,
} from "../notification/notificationCatalog.js";
import {
  COMPANY_DASHBOARD_ROUTES,
  EMPLOYEE_DASHBOARD_ROUTES,
  buildDashboardTarget,
} from "../notification/dashboardRoutes.js";

const readSource = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const campusNotificationSource = readSource("notification/CampusNotifications.js");
const campusControllerSource = readSource("controllers/app/campus/campusController.js");
const auditModelSource = readSource("models/AuditLogModel.js");

const requiredEvents = [
  "application_status_shortlisted",
  "interview_scheduled",
  "interview_updated",
  "job_applied",
  "company_viewed_profile",
  "new_matching_job",
  "campus_verification_approved",
  "campus_verification_rejected",
  "campus_verification_more_information_requested",
  "campus_event_registered",
  "campus_event_reminder",
  "cv_export_ready",
  "ai_result_ready",
];

const missingText = requiredEvents.filter((event) => !NOTIFICATION_TEXT[event]?.en);
assert.deepEqual(missingText, [], "notification catalog is missing launch event text");

const missingRoutes = requiredEvents.filter((event) => !EVENT_ROUTE[event]?.audience || !EVENT_ROUTE[event]?.routeKey);
assert.deepEqual(missingRoutes, [], "notification catalog is missing launch event routes");

const routeMapForAudience = {
  employee: EMPLOYEE_DASHBOARD_ROUTES,
  company: COMPANY_DASHBOARD_ROUTES,
};

const missingRouteKeys = requiredEvents.filter((event) => {
  const route = routeForEvent(event);
  const map = routeMapForAudience[route.audience] || {};
  return !Object.prototype.hasOwnProperty.call(map, route.routeKey);
});

assert.deepEqual(missingRouteKeys, [], "notification launch event route keys must be dashboard-backed");

assert.equal(
  renderNotificationText("campus_verification_approved", "en", { university: "Hala University" }).title,
  "Campus status approved"
);
assert.match(
  renderNotificationText("new_matching_job", "en", { job: "Retail Assistant" }).body,
  /Retail Assistant/
);

const campusTarget = buildDashboardTarget("employee", "campus.verification", { verificationId: "abc" });
assert.equal(campusTarget.route_key, "campus.verification");
assert.equal(campusTarget.route_path, "campus/verification");

assert.deepEqual(
  [
    "campusVerificationApprovedNotification",
    "campusVerificationRejectedNotification",
    "campusVerificationMoreInfoNotification",
    "campusEventRegisteredNotification",
    "campusEventReminderNotification",
    "notifyUser",
  ].filter((snippet) => !campusNotificationSource.includes(snippet)),
  [],
  "CampusNotifications.js is missing campus notification helpers"
);

assert.deepEqual(
  [
    "campusVerificationApprovedNotification",
    "campusVerificationRejectedNotification",
    "campusVerificationMoreInfoNotification",
    "campusEventRegisteredNotification",
  ].filter((snippet) => !campusControllerSource.includes(snippet)),
  [],
  "campusController.js must notify students on verification and event registration"
);

assert.ok(
  auditModelSource.includes('"university_admin"') || auditModelSource.includes("'university_admin'"),
  "AuditLogModel must allow university_admin actors"
);

console.log(`Notification event contract verified (${requiredEvents.length} launch events).`);
