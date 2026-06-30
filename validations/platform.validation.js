import yup from "yup";

const objectIdRe = /^[a-f\d]{24}$/i;
const safeKeyRe = /^[A-Za-z0-9_.-]+$/;
const unsafeKeys = new Set(["__proto__", "prototype", "constructor"]);

const objectId = yup.string().trim().matches(objectIdRe, "Invalid ObjectId");

const hasUnsafePayloadKey = (value) => {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some(hasUnsafePayloadKey);

  return Object.entries(value).some(([key, child]) => {
    const parts = String(key).split(".");
    return (
      parts.some((part) => unsafeKeys.has(part) || !safeKeyRe.test(part)) ||
      hasUnsafePayloadKey(child)
    );
  });
};

const safeObject = yup
  .object()
  .test(
    "safe-object-keys",
    "Payload contains unsafe field names",
    (value) => !hasUnsafePayloadKey(value),
  );

const bodyObject = yup
  .object()
  .test(
    "safe-payload-keys",
    "Payload contains unsafe field names",
    (value) => !hasUnsafePayloadKey(value),
  );

const boolish = yup
  .mixed()
  .test(
    "valid-boolean",
    "Must be a boolean",
    (value) =>
      value === undefined ||
      value === true ||
      value === false ||
      value === 1 ||
      value === 0 ||
      value === "true" ||
      value === "false" ||
      value === "1" ||
      value === "0" ||
      value === "yes" ||
      value === "no" ||
      value === "on" ||
      value === "off",
  );

const jobIdParam = yup.object({
  jobId: objectId.required("jobId is required"),
});

const optionalIdParam = yup.object({
  id: objectId,
});

const idParam = yup.object({
  id: objectId.required("id is required"),
});

const memberIdParam = yup.object({
  memberId: objectId.required("memberId is required"),
});

const partnerIdParam = yup.object({
  partnerId: objectId.required("partnerId is required"),
});

const studentIdParam = yup.object({
  studentId: objectId.required("studentId is required"),
});

const eventIdParam = yup.object({
  eventId: yup.string().trim().max(120).required("eventId is required"),
});

const campusEventStatus = yup
  .string()
  .trim()
  .oneOf(["draft", "published", "archived", "cancelled"]);

const campusEventVisibility = yup.string().trim().oneOf(["public", "campus"]);

const optionalStringArray = yup
  .mixed()
  .test("valid-string-array", "Must be an array or comma-separated string", (value) => {
    if (value === undefined) return true;
    if (typeof value === "string") return true;
    return Array.isArray(value);
  });

const notificationIdentifierBody = bodyObject.shape({
  id: objectId,
  notification_id: objectId,
});

const deviceTokenIdentifierBody = bodyObject.shape({
  id: objectId,
  token_id: objectId,
  token: yup.string().trim().max(4096),
  deviceId: yup.string().trim().max(180),
  device_id: yup.string().trim().max(180),
});

const deviceTokenIdentifierQuery = yup.object({
  id: objectId,
  token_id: objectId,
  token: yup.string().trim().max(4096),
  deviceId: yup.string().trim().max(180),
  device_id: yup.string().trim().max(180),
});

const translationText = yup
  .mixed()
  .test(
    "valid-translation-text",
    "translated text must be an object or string",
    (value) =>
      value === undefined ||
      typeof value === "string" ||
      (value && typeof value === "object"),
  );

const schemas = {
  aiRequestSchema: yup.object({
    body: bodyObject,
  }),

  aiJobRequestSchema: yup.object({
    params: jobIdParam,
    body: bodyObject,
  }),

  analyticsTrackSchema: yup.object({
    body: bodyObject.shape({
      event: yup.string().trim().max(120).required("event is required"),
      group: yup.string().trim().max(80),
      company_id: objectId,
      entity_type: yup.string().trim().max(80),
      entity_id: yup.string().trim().max(120),
      job_id: objectId,
      application_id: objectId,
      session_id: yup.string().trim().max(180),
      platform: yup.string().trim().max(80),
      app_version: yup.string().trim().max(80),
      metadata: safeObject,
    }),
  }),

  notificationPreferencesSchema: yup.object({
    body: bodyObject,
  }),

  settingsUpdateSchema: yup.object({
    body: bodyObject,
  }),

  notificationMarkReadSchema: yup.object({
    params: optionalIdParam,
    query: yup.object({
      id: objectId,
      notification_id: objectId,
    }),
    body: notificationIdentifierBody,
  }),

  deviceTokenRegisterSchema: yup.object({
    body: bodyObject.shape({
      token: yup.string().trim().max(4096).required("token is required"),
      platform: yup.string().trim().max(80),
      deviceId: yup.string().trim().max(180),
      device_id: yup.string().trim().max(180),
      brand: yup.string().trim().max(120),
      model_name: yup.string().trim().max(180),
      model_id: yup.string().trim().max(180),
      build_id: yup.string().trim().max(180),
      is_default: boolish,
      topics: yup
        .mixed()
        .test("valid-topics", "topics must be an array", (value) => {
          if (value === undefined) return true;
          return Array.isArray(value);
        }),
    }),
  }),

  deviceTokenDeleteSchema: yup.object({
    params: optionalIdParam,
    query: deviceTokenIdentifierQuery,
    body: deviceTokenIdentifierBody,
  }),

  trustJobScoreSchema: yup.object({
    params: jobIdParam,
    body: bodyObject,
  }),

  trustJobReportSchema: yup.object({
    params: jobIdParam,
    body: bodyObject.shape({
      reason: yup.string().trim().max(80),
      message: yup.string().trim().max(2000),
      note: yup.string().trim().max(2000),
    }),
  }),

  trustJobDocumentsSchema: yup.object({
    params: jobIdParam,
    body: bodyObject.shape({
      note: yup.string().trim().max(2000),
      message: yup.string().trim().max(2000),
      response: yup.string().trim().max(2000),
      description: yup.string().trim().max(2000),
      links: yup.mixed(),
      evidence_links: yup.mixed(),
      documents: yup.mixed(),
      files: yup.mixed(),
    }),
  }),

  trustAdminActionSchema: yup.object({
    params: jobIdParam,
    body: bodyObject.shape({
      note: yup.string().trim().max(2000),
      admin_note: yup.string().trim().max(2000),
      reason: yup.string().trim().max(2000),
      message: yup.string().trim().max(2000),
    }),
  }),

  jobTranslationSaveSchema: yup.object({
    params: yup.object({
      jobId: objectId.required("jobId is required"),
      lang: yup.string().trim().max(16).required("lang is required"),
    }),
    body: bodyObject.shape({
      source_language: yup.string().trim().max(16),
      sourceLanguage: yup.string().trim().max(16),
      original_text: translationText,
      original: translationText,
      translated_text: translationText,
      translation: translationText,
      ai_request_id: objectId,
      aiRequestId: objectId,
      approve: boolish,
      status: yup.string().trim().max(80),
      rejection_reason: yup.string().trim().max(1000),
      source: yup.string().trim().max(80),
      metadata: safeObject,
    }),
  }),

  campusListSchema: yup.object({
    query: yup.object({
      page: yup.number().integer().min(1).max(100000),
      limit: yup.number().integer().min(1).max(200),
      status: yup.string().trim().max(80),
      q: yup.string().trim().max(200),
      search: yup.string().trim().max(200),
    }),
    body: bodyObject,
  }),

  campusIdActionSchema: yup.object({
    params: idParam,
    body: bodyObject,
  }),

  campusEventActionSchema: yup.object({
    params: eventIdParam,
    body: bodyObject.shape({
      event_id: yup.string().trim().max(120),
      title: yup.string().trim().max(240),
      event_title: yup.string().trim().max(240),
      organizer: yup.string().trim().max(240),
      kind: yup.string().trim().max(120),
      date_label: yup.string().trim().max(120),
      date: yup.string().trim().max(120),
      start_at: yup.string().trim().max(120),
      starts_at: yup.string().trim().max(120),
      event_start_at: yup.string().trim().max(120),
      eventStartAt: yup.string().trim().max(120),
      mode: yup.string().trim().max(120),
      note: yup.string().trim().max(1000),
    }),
  }),

  universityEventListSchema: yup.object({
    query: yup.object({
      page: yup.number().integer().min(1).max(100000),
      limit: yup.number().integer().min(1).max(200),
      status: yup.string().trim().max(80),
      q: yup.string().trim().max(200),
      search: yup.string().trim().max(200),
      university_id: objectId,
    }),
    body: bodyObject,
  }),

  universityEventCreateSchema: yup.object({
    body: bodyObject.shape({
      university_id: objectId,
      event_id: yup.string().trim().max(120),
      title: yup.string().trim().max(240),
      event_title: yup.string().trim().max(240),
      summary: yup.string().trim().max(2000),
      description: yup.string().trim().max(10000),
      details: yup.string().trim().max(10000),
      organizer: yup.string().trim().max(240),
      host: yup.string().trim().max(240),
      kind: yup.string().trim().max(120),
      tag: yup.string().trim().max(120),
      type: yup.string().trim().max(120),
      mode: yup.string().trim().max(120),
      date_label: yup.string().trim().max(160),
      date: yup.string().trim().max(160),
      meta: yup.string().trim().max(240),
      start_at: yup.string().trim().max(120),
      starts_at: yup.string().trim().max(120),
      end_at: yup.string().trim().max(120),
      ends_at: yup.string().trim().max(120),
      location: yup.string().trim().max(240),
      campus_name: yup.string().trim().max(240),
      campus: yup.string().trim().max(240),
      registration_url: yup.string().trim().max(2000),
      url: yup.string().trim().max(2000),
      capacity: yup.number().integer().min(0).max(100000),
      featured: boolish,
      tags: optionalStringArray,
      bullets: optionalStringArray,
      highlights: optionalStringArray,
      agenda: optionalStringArray,
      status: campusEventStatus,
      visibility: campusEventVisibility,
      sort_order: yup.number().integer().min(-100000).max(100000),
      order: yup.number().integer().min(-100000).max(100000),
    }),
  }),

  universityEventUpdateSchema: yup.object({
    params: idParam,
    body: bodyObject.shape({
      event_id: yup.string().trim().max(120),
      title: yup.string().trim().max(240),
      event_title: yup.string().trim().max(240),
      summary: yup.string().trim().max(2000),
      description: yup.string().trim().max(10000),
      details: yup.string().trim().max(10000),
      organizer: yup.string().trim().max(240),
      host: yup.string().trim().max(240),
      kind: yup.string().trim().max(120),
      tag: yup.string().trim().max(120),
      type: yup.string().trim().max(120),
      mode: yup.string().trim().max(120),
      date_label: yup.string().trim().max(160),
      date: yup.string().trim().max(160),
      meta: yup.string().trim().max(240),
      start_at: yup.string().trim().max(120),
      starts_at: yup.string().trim().max(120),
      end_at: yup.string().trim().max(120),
      ends_at: yup.string().trim().max(120),
      location: yup.string().trim().max(240),
      campus_name: yup.string().trim().max(240),
      campus: yup.string().trim().max(240),
      registration_url: yup.string().trim().max(2000),
      url: yup.string().trim().max(2000),
      capacity: yup.number().integer().min(0).max(100000).nullable(),
      featured: boolish,
      tags: optionalStringArray,
      bullets: optionalStringArray,
      highlights: optionalStringArray,
      agenda: optionalStringArray,
      status: campusEventStatus,
      visibility: campusEventVisibility,
      sort_order: yup.number().integer().min(-100000).max(100000),
      order: yup.number().integer().min(-100000).max(100000),
    }),
  }),

  universityEventDeleteSchema: yup.object({
    params: idParam,
  }),

  campusApplicationMessageSchema: yup.object({
    params: idParam,
    body: bodyObject.shape({
      message: yup.string().trim().max(5000),
      body: yup.string().trim().max(5000),
      note: yup.string().trim().max(5000),
      channel: yup.string().trim().max(80),
    }),
  }),

  campusProfileSchema: yup.object({
    body: bodyObject.shape({
      university_id: objectId,
      university: yup.string().trim().max(240),
      specialty: yup.string().trim().max(240),
      sub_specialty: yup.string().trim().max(240),
      academic_year: yup.string().trim().max(80),
      gpa: yup.string().trim().max(80),
      work_readiness: yup.string().trim().max(120),
      preferred_work_location: yup.string().trim().max(240),
      readiness_score: yup.number().min(0).max(100),
      candidate_stage: yup.string().trim().max(80),
      expected_graduation_year: yup.number().integer().min(1900).max(2200),
      profile_headline: yup.string().trim().max(240),
      about_me: yup.string().trim().max(5000),
    }),
  }),

  campusTalentVisibilitySchema: yup.object({
    body: bodyObject.shape({
      talent_pool_opt_in: boolish,
      opt_in: boolish,
      enabled: boolish,
      visible_to_partner_companies: boolish,
      partner_companies: boolish,
      visible_to_partners: boolish,
      contact_visible: boolish,
      cv_visible: boolish,
      projects_visible: boolish,
      gpa_visible: boolish,
      visible_fields: bodyObject.shape({
        contact: boolish,
        cv: boolish,
        projects: boolish,
        gpa: boolish,
      }),
    }),
  }),

  campusVerificationStartSchema: yup.object({
    body: bodyObject.shape({
      university_id: objectId,
      university: yup.string().trim().max(240),
      student_email: yup.string().trim().email().max(254),
      method: yup.string().trim().max(80),
      verification_method: yup.string().trim().max(80),
      student_id_number: yup.string().trim().max(120),
      student_number: yup.string().trim().max(120),
      campus: yup.string().trim().max(240),
      faculty_major: yup.string().trim().max(240),
      major: yup.string().trim().max(240),
      specialty: yup.string().trim().max(240),
      degree_level: yup.string().trim().max(120),
      degree: yup.string().trim().max(120),
      graduation_year: yup.number().integer().min(1900).max(2200),
      expected_graduation_year: yup.number().integer().min(1900).max(2200),
      invite_code: yup.string().trim().max(120),
      code: yup.string().trim().max(120),
      source: yup.string().trim().max(120),
      academic_year: yup.string().trim().max(80),
    }),
  }),

  campusVerificationConfirmSchema: yup.object({
    body: bodyObject.shape({
      code: yup.string().trim().max(32),
      passcode: yup.string().trim().max(32),
      otp: yup.string().trim().max(32),
      verification_id: objectId,
      id: objectId,
    }),
  }),

  campusVerificationDocumentSchema: yup.object({
    body: bodyObject.shape({
      verification_id: objectId,
      id: objectId,
      university_id: objectId,
      university: yup.string().trim().max(240),
      document_url: yup.string().trim().max(2000),
      note: yup.string().trim().max(2000),
    }),
  }),

  campusVerificationResubmitSchema: yup.object({
    params: idParam,
    body: bodyObject.shape({
      note: yup.string().trim().max(2000),
    }),
  }),

  campusAdminVerificationActionSchema: yup.object({
    params: idParam,
    body: bodyObject.shape({
      reason: yup.string().trim().max(2000),
      rejection_reason: yup.string().trim().max(2000),
      requested_information: yup.string().trim().max(2000),
      status: yup.string().trim().max(80),
    }),
  }),

  universityMemberCreateSchema: yup.object({
    body: bodyObject.shape({
      user_id: objectId,
      user: objectId,
      role: yup.string().trim().max(80),
      member_role: yup.string().trim().max(80),
      status: yup.string().trim().max(80),
      permissions: yup
        .mixed()
        .test("valid-permissions", "permissions must be an array", (value) => {
          if (value === undefined) return true;
          return Array.isArray(value);
        }),
    }),
  }),

  universityMemberUpdateSchema: yup.object({
    params: memberIdParam,
    body: bodyObject.shape({
      role: yup.string().trim().max(80),
      member_role: yup.string().trim().max(80),
      status: yup.string().trim().max(80),
      permissions: yup
        .mixed()
        .test("valid-permissions", "permissions must be an array", (value) => {
          if (value === undefined) return true;
          return Array.isArray(value);
        }),
    }),
  }),

  universityMemberDeleteSchema: yup.object({
    params: memberIdParam,
  }),

  universityStudentDetailSchema: yup.object({
    params: studentIdParam,
  }),

  universityPartnerActionSchema: yup.object({
    params: partnerIdParam,
    body: bodyObject.shape({
      note: yup.string().trim().max(2000),
      reason: yup.string().trim().max(2000),
      university_note: yup.string().trim().max(2000),
      access_level: yup
        .string()
        .trim()
        .oneOf(["jobs_only", "applicants_only", "talent_pool_limited"]),
      expires_at: yup.string().trim().max(120),
      allowed_departments: yup.mixed(),
      allowed_programs: yup.mixed(),
      allowed_campuses: yup.mixed(),
    }),
  }),

  universityOpportunityRequestSchema: yup.object({
    body: bodyObject.shape({
      title: yup.string().trim().max(240),
      job_name: yup.string().trim().max(240),
      target: yup.string().trim().max(80),
      candidate_target: yup.string().trim().max(80),
      description: yup.string().trim().max(5000),
      details: yup.string().trim().max(5000),
      requested_count: yup.number().integer().min(1).max(100000),
      note: yup.string().trim().max(2000),
    }),
  }),
};

export default schemas;
