import { notifyUser } from "./notificationService.js";

const idOf = (value) => value?._id || value || "";
const clean = (value = "") => String(value || "").trim();

const universityNameFrom = (verification = {}, fallback = "your university") => {
  const university = verification.university_id || verification.university || {};
  return clean(university.name_en || university.name || verification.university_name || fallback);
};

const notifyCampusVerification = (eventKey, verification = {}, extra = {}) => {
  const verificationId = idOf(verification._id || verification.id);
  const universityId = idOf(verification.university_id);
  const status = clean(extra.status || verification.status);

  return notifyUser({
    userId: verification.user_id,
    eventKey,
    audience: "employee",
    routeKey: "campus.verification",
    routeParams: { id: verificationId, verificationId },
    params: {
      university: universityNameFrom(verification),
      reason: clean(extra.reason || verification.rejection_reason || verification.requested_information),
    },
    data: {
      verification_id: verificationId,
      university_id: universityId,
      status,
      reason: clean(extra.reason || verification.rejection_reason || verification.requested_information),
    },
    dedupeKey: verificationId && status ? `campus_verification:${verificationId}:${status}` : null,
  });
};

export const campusVerificationApprovedNotification = (verification = {}) =>
  notifyCampusVerification("campus_verification_approved", verification, { status: "verified" });

export const campusVerificationRejectedNotification = (verification = {}, reason = "") =>
  notifyCampusVerification("campus_verification_rejected", verification, { status: "rejected", reason });

export const campusVerificationMoreInfoNotification = (verification = {}, reason = "") =>
  notifyCampusVerification("campus_verification_more_information_requested", verification, {
    status: "needs_more_information",
    reason,
  });

export const campusEventRegisteredNotification = (registration = {}) =>
  notifyUser({
    userId: registration.user_id,
    eventKey: "campus_event_registered",
    audience: "employee",
    routeKey: "campus.events",
    routeParams: { id: registration.event_id || registration._id || "", eventId: registration.event_id || "" },
    params: { event: clean(registration.title || "Campus event") },
    data: {
      event_id: registration.event_id || "",
      registration_id: idOf(registration._id || registration.id),
      title: clean(registration.title),
      organizer: clean(registration.organizer),
      date_label: clean(registration.date_label),
      mode: clean(registration.mode),
      status: clean(registration.status || "registered"),
    },
    dedupeKey: registration.event_id
      ? `campus_event:${registration.user_id}:${registration.event_id}:registered`
      : null,
  });

export const campusEventReminderNotification = (registration = {}) =>
  notifyUser({
    userId: registration.user_id,
    eventKey: "campus_event_reminder",
    audience: "employee",
    routeKey: "campus.events",
    routeParams: { id: registration.event_id || registration._id || "", eventId: registration.event_id || "" },
    params: { event: clean(registration.title || "Campus event") },
    data: {
      event_id: registration.event_id || "",
      registration_id: idOf(registration._id || registration.id),
      title: clean(registration.title),
      date_label: clean(registration.date_label),
      mode: clean(registration.mode),
    },
    dedupeKey: registration.event_id
      ? `campus_event:${registration.user_id}:${registration.event_id}:reminder`
      : null,
  });

export default {
  campusVerificationApprovedNotification,
  campusVerificationRejectedNotification,
  campusVerificationMoreInfoNotification,
  campusEventRegisteredNotification,
  campusEventReminderNotification,
};
