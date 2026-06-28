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
    (value) => !hasUnsafePayloadKey(value)
  );

const bodyObject = yup
  .object()
  .test(
    "safe-payload-keys",
    "Payload contains unsafe field names",
    (value) => !hasUnsafePayloadKey(value)
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
      value === "off"
  );

const jobIdParam = yup.object({
  jobId: objectId.required("jobId is required"),
});

const optionalIdParam = yup.object({
  id: objectId,
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

const translationText = yup.mixed().test(
  "valid-translation-text",
  "translated text must be an object or string",
  (value) => value === undefined || typeof value === "string" || (value && typeof value === "object")
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
      topics: yup.mixed().test("valid-topics", "topics must be an array", (value) => {
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
};

export default schemas;
