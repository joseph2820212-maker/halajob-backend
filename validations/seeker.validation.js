import yup from "yup";

const objectIdRe = /^[a-f\d]{24}$/i;
const unsafeKeys = new Set(["__proto__", "prototype", "constructor"]);
const safeKeySegmentRe = /^[A-Za-z0-9_-]+$/;

const blankToUndefined = (value, originalValue) =>
  typeof originalValue === "string" && originalValue.trim() === "" ? undefined : value;

const objectId = yup.string().transform(blankToUndefined).trim().matches(objectIdRe, "Invalid ObjectId");
const safeSegment = yup.string().trim().matches(/^[A-Za-z0-9_.-]{1,180}$/, "Invalid path segment");
const langSegment = yup.string().trim().matches(/^[A-Za-z0-9_-]{1,16}$/, "Invalid language");
const text = (max = 2000) => yup.string().transform(blankToUndefined).trim().max(max);

const hasUnsafePayloadKey = (value) => {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some(hasUnsafePayloadKey);

  return Object.entries(value).some(([key, child]) => {
    const parts = String(key).split(/[.[\]]+/).filter(Boolean);
    return (
      parts.length === 0 ||
      parts.some((part) => unsafeKeys.has(part) || !safeKeySegmentRe.test(part)) ||
      hasUnsafePayloadKey(child)
    );
  });
};

const bodyObject = yup
  .object()
  .test(
    "safe-payload-keys",
    "Payload contains unsafe field names",
    (value) => !hasUnsafePayloadKey(value)
  );

const queryObject = yup
  .object({
    page: yup.number().integer().min(1).max(100000),
    limit: yup.number().integer().min(1).max(500),
    paginate: yup.number().integer().min(1).max(500),
    status: text(120),
    q: text(240),
    search: text(240),
    sort: text(120),
  })
  .test(
    "safe-query-keys",
    "Query contains unsafe field names",
    (value) => !hasUnsafePayloadKey(value)
  );

const safeObject = bodyObject;

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

const rating = yup
  .mixed()
  .test("valid-rating", "rating must be between 1 and 5", (value) => {
    if (value === undefined || value === "") return true;
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 1 && parsed <= 5;
  });

const params = {
  id: yup.object({ id: objectId.required("id is required") }),
  jobId: yup.object({ jobId: objectId.required("jobId is required") }),
  companyId: yup.object({ companyId: objectId.required("companyId is required") }),
  applicationId: yup.object({ applicationId: objectId.required("applicationId is required") }),
  interviewId: yup.object({ interviewId: objectId.required("interviewId is required") }),
  invitationId: yup.object({ invitationId: objectId.required("invitationId is required") }),
  cvId: yup.object({ cvId: objectId.required("cvId is required") }),
  parseJobId: yup.object({ jobId: objectId.required("jobId is required") }),
  lang: yup.object({ lang: langSegment.required("lang is required") }),
  section: yup.object({ section: safeSegment.required("section is required") }),
  sectionItem: yup.object({
    section: safeSegment.required("section is required"),
    itemId: safeSegment.required("itemId is required"),
  }),
};

const translationText = yup.mixed().test(
  "valid-translation-text",
  "translated text must be an object or string",
  (value) => value === undefined || typeof value === "string" || (value && typeof value === "object")
);

const schemas = {
  bodySchema: yup.object({
    body: bodyObject,
  }),

  listSchema: yup.object({
    query: queryObject,
    body: bodyObject,
  }),

  loginSchema: yup.object({
    body: bodyObject.shape({
      email: text(254).required("Email or phone is required"),
      password: yup.string().required("Password is required"),
    }),
  }),

  idBodySchema: yup.object({
    params: params.id,
    body: bodyObject,
  }),

  jobBodySchema: yup.object({
    params: params.jobId,
    body: bodyObject,
  }),

  legacyJobBodySchema: yup.object({
    params: params.id,
    body: bodyObject,
  }),

  applicationBodySchema: yup.object({
    params: params.applicationId,
    body: bodyObject,
  }),

  interviewBodySchema: yup.object({
    params: params.interviewId,
  }),

  interviewResponseSchema: yup.object({
    params: params.interviewId,
    body: bodyObject.shape({
      status: text(120),
      response: text(120),
      action: text(120),
      candidate_note: text(2000),
      note: text(2000),
    }),
  }),

  interviewRescheduleSchema: yup.object({
    params: params.interviewId,
    body: bodyObject.shape({
      note: text(2000),
      candidate_note: text(2000),
      reason: text(2000),
      preferred_start_at: text(120),
      preferred_end_at: text(120),
      start_at: text(120),
      end_at: text(120),
    }),
  }),

  invitationResponseSchema: yup.object({
    params: params.invitationId,
    body: bodyObject.shape({
      status: text(120),
      response: text(120),
      note: text(2000),
    }),
  }),

  applicationMessageSchema: yup.object({
    params: params.applicationId,
    body: bodyObject.shape({
      message: text(5000),
      body: text(5000),
      note: text(5000),
      channel: text(80),
    }),
  }),

  applicationCancelSchema: yup.object({
    params: params.applicationId,
    body: bodyObject.shape({
      note: text(2000),
    }),
  }),

  jobApplySchema: yup.object({
    params: params.jobId,
    body: bodyObject.shape({
      first_name: text(120),
      last_name: text(120),
      email: text(254),
      phone_code: text(20),
      phone_national: text(60),
      phone: text(60),
      country_id: objectId,
      cv: text(1000),
      cv_id: objectId,
      cvId: objectId,
      cover_letter: text(5000),
      source: text(80),
      answers: yup.mixed(),
    }),
  }),

  legacyJobApplySchema: yup.object({
    params: params.id,
    body: bodyObject.shape({
      first_name: text(120),
      last_name: text(120),
      email: text(254),
      phone_code: text(20),
      phone_national: text(60),
      phone: text(60),
      country_id: objectId,
      cv: text(1000),
      cv_id: objectId,
      cvId: objectId,
      cover_letter: text(5000),
      source: text(80),
      answers: yup.mixed(),
    }),
  }),

  jobRateSchema: yup.object({
    params: params.jobId,
    body: bodyObject.shape({
      rating,
    }),
  }),

  legacyJobRateSchema: yup.object({
    params: params.id,
    body: bodyObject.shape({
      rating,
    }),
  }),

  jobReviewSchema: yup.object({
    params: params.jobId,
    body: bodyObject.shape({
      rating,
      message: text(5000),
      review: text(5000),
      note: text(5000),
    }),
  }),

  legacyJobReviewSchema: yup.object({
    params: params.id,
    body: bodyObject.shape({
      rating,
      message: text(5000),
      review: text(5000),
      note: text(5000),
      reason: text(2000),
    }),
  }),

  companyReviewSchema: yup.object({
    params: params.companyId,
    body: bodyObject.shape({
      rating,
      message: text(5000),
      review: text(5000),
      note: text(5000),
    }),
  }),

  profileBodySchema: yup.object({
    body: bodyObject,
  }),

  basicProfileSchema: yup.object({
    body: bodyObject.shape({
      first_name: text(120),
      mid_name: text(120),
      last_name: text(120),
      phone: text(60),
      phone_code: text(20),
      gender: text(40),
    }),
  }),

  profileSectionSchema: yup.object({
    params: params.section,
    body: bodyObject,
  }),

  profileSectionItemSchema: yup.object({
    params: params.sectionItem,
    body: bodyObject,
  }),

  cvUploadSchema: yup.object({
    body: bodyObject.shape({
      title: text(240),
      lang: text(16),
      is_default: boolish,
    }),
  }),

  cvIdSchema: yup.object({
    params: params.cvId,
    body: bodyObject,
  }),

  cvParseUploadSchema: yup.object({
    body: bodyObject.shape({
      title: text(240),
      lang: text(16),
      is_default: boolish,
    }),
  }),

  cvParseJobSchema: yup.object({
    params: params.parseJobId,
  }),

  cvParseJobActionSchema: yup.object({
    params: params.parseJobId,
    body: bodyObject,
  }),

  cvDuplicateSchema: yup.object({
    params: params.cvId,
    body: bodyObject.shape({
      title: text(240),
    }),
  }),

  cvVisibilitySchema: yup.object({
    params: params.cvId,
    body: bodyObject.shape({
      visibility: yup
        .string()
        .oneOf(["private", "link", "applications_only", "profile"])
        .required("visibility is required"),
    }),
  }),

  cvCoverLetterSchema: yup.object({
    params: params.cvId,
    body: bodyObject.shape({
      template_key: text(80),
      key: text(80),
      job_id: objectId,
      jobId: objectId,
      job_title: text(240),
      role: text(240),
      company_name: text(240),
      notes: text(2000),
    }),
  }),

  cvGenerateSchema: yup.object({
    body: bodyObject.shape({
      template_id: objectId,
      template_key: text(120),
      lang: text(16),
      colors: safeObject,
      font: safeObject,
      sections: safeObject,
      section_order: yup.mixed(),
      title: text(240),
      is_default: boolish,
    }),
  }),

  jobCreateSchema: yup.object({
    body: bodyObject,
  }),

  legacyIdActionSchema: yup.object({
    params: params.id,
    body: bodyObject,
  }),

  legacyApplicationStatusSchema: yup.object({
    params: params.id,
    body: bodyObject.shape({
      status: text(120),
      reason: text(2000),
      note: text(2000),
      message: text(5000),
    }),
  }),

  legacyInterviewCreateSchema: yup.object({
    params: params.id,
    body: bodyObject.shape({
      start_at: text(120),
      end_at: text(120),
      date: text(120),
      time: text(120),
      timezone: text(120),
      meet_link: text(1000),
      office_address: text(1000),
      message: text(5000),
      note: text(5000),
    }),
  }),

  companyBodySchema: yup.object({
    body: bodyObject,
    query: queryObject,
  }),

  companyFileDeleteSchema: yup.object({
    body: bodyObject.shape({
      filename: safeSegment,
    }),
    query: yup.object({
      filename: safeSegment,
    }),
  }),

  fcmTokenRegisterSchema: yup.object({
    body: bodyObject.shape({
      token: text(4096).required("token is required"),
      platform: text(80),
      deviceId: text(180),
      device_id: text(180),
      is_default: boolish,
      topics: yup.mixed().test("valid-topics", "topics must be an array", (value) => {
        if (value === undefined) return true;
        return Array.isArray(value);
      }),
    }),
  }),

  fcmTokenUpdateSchema: yup.object({
    params: params.id,
    body: bodyObject.shape({
      is_default: boolish,
      revoked: boolish,
      topics: yup.mixed().test("valid-topics", "topics must be an array", (value) => {
        if (value === undefined) return true;
        return Array.isArray(value);
      }),
    }),
  }),

  notificationPreferencesSchema: yup.object({
    body: bodyObject,
  }),

  communicationPreferencesSchema: yup.object({
    body: bodyObject.shape({
      channels: safeObject,
      categories: safeObject,
      quiet_hours: safeObject,
      phone_for_sms: text(60),
      phoneForSms: text(60),
      lang: text(16),
      language: text(16),
    }),
  }),

  manualWhatsappLinkSchema: yup.object({
    body: bodyObject
      .shape({
        phone: text(60),
        recipient: text(60),
        text: text(1200),
        message: text(1200),
        body: text(1200),
      })
      .test(
        "manual-whatsapp-text-present",
        "Manual WhatsApp text is required",
        (value = {}) => Boolean(value.text || value.message || value.body),
      ),
  }),

  salaryInsightQuerySchema: yup.object({
    query: queryObject.shape({
      title: text(180),
      job_title: text(180),
      city: text(120),
      country: text(120),
      currency_code: text(12),
      currency: text(12),
      experience_level_id: objectId,
      industry_id: objectId,
    }),
  }),

  salaryInsightJobSchema: yup.object({
    params: params.jobId,
  }),

  notificationIdSchema: yup.object({
    params: params.id,
    body: bodyObject,
  }),

  notificationActionSchema: yup.object({
    body: bodyObject,
  }),

  careerPassportSchema: yup.object({
    body: bodyObject,
  }),

  cvTranslationSaveSchema: yup.object({
    params: params.lang,
    query: yup.object({
      cv_id: objectId,
      cvId: objectId,
    }),
    body: bodyObject.shape({
      cv_id: objectId,
      cvId: objectId,
      source_language: text(16),
      sourceLanguage: text(16),
      original_text: translationText,
      original: translationText,
      translated_text: translationText,
      translation: translationText,
      ai_request_id: objectId,
      aiRequestId: objectId,
      approve: boolish,
      status: text(80),
      rejection_reason: text(1000),
      source: text(80),
      metadata: safeObject,
    }),
  }),
};

export default schemas;
