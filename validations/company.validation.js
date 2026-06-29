import yup from "yup";

const objectIdRe = /^[a-f\d]{24}$/i;
const safeKeyRe = /^[A-Za-z0-9_.-]+$/;
const unsafeKeys = new Set(["__proto__", "prototype", "constructor"]);

const objectId = yup.string().trim().matches(objectIdRe, "Invalid ObjectId");
const safeSegment = yup
  .string()
  .trim()
  .matches(/^[A-Za-z0-9_.-]{1,180}$/, "Invalid path segment");

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

const bodyObject = yup
  .object()
  .test(
    "safe-payload-keys",
    "Payload contains unsafe field names",
    (value) => !hasUnsafePayloadKey(value),
  );

const queryObject = yup
  .object({
    page: yup.number().integer().min(1).max(100000),
    limit: yup.number().integer().min(1).max(500),
    status: yup.string().trim().max(120),
    q: yup.string().trim().max(240),
    search: yup.string().trim().max(240),
  })
  .test(
    "safe-query-keys",
    "Query contains unsafe field names",
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

const money = yup
  .mixed()
  .test("valid-money", "Must be a positive number", (value) => {
    if (value === undefined || value === null || value === "") return true;
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0;
  });

const idsBody = bodyObject.shape({
  ids: yup.mixed(),
  job_ids: yup.mixed(),
  application_ids: yup.mixed(),
});

const params = {
  jobId: yup.object({ jobId: objectId.required("jobId is required") }),
  applicationId: yup.object({
    applicationId: objectId.required("applicationId is required"),
  }),
  interviewId: yup.object({
    interviewId: objectId.required("interviewId is required"),
  }),
  invitationId: yup.object({
    invitationId: objectId.required("invitationId is required"),
  }),
  memberId: yup.object({ memberId: objectId.required("memberId is required") }),
  questionId: yup.object({
    questionId: objectId.required("questionId is required"),
  }),
  templateId: yup.object({
    templateId: objectId.required("templateId is required"),
  }),
  ticketId: yup.object({ ticketId: objectId.required("ticketId is required") }),
  requestId: yup.object({
    requestId: objectId.required("requestId is required"),
  }),
  employeeId: yup.object({
    employeeId: objectId.required("employeeId is required"),
  }),
  candidateId: yup.object({
    id: objectId.required("candidate id is required"),
  }),
  candidateTag: yup.object({
    id: objectId.required("candidate id is required"),
    tag: safeSegment.required("tag is required"),
  }),
  universityId: yup.object({
    universityId: objectId.required("universityId is required"),
  }),
  filename: yup.object({
    filename: safeSegment.required("filename is required"),
  }),
  profileSection: yup.object({
    section: safeSegment.required("section is required"),
  }),
  profileSectionItem: yup.object({
    section: safeSegment.required("section is required"),
    itemId: safeSegment.required("itemId is required"),
  }),
};

const schemas = {
  loginSchema: yup.object({
    body: bodyObject.shape({
      email: yup.string().trim().required("Email or phone is required"),
      password: yup.string().required("Password is required"),
    }),
  }),

  logoutSchema: yup.object({
    body: bodyObject.shape({
      refreshToken: yup.string().trim(),
      refresh_token: yup.string().trim(),
    }),
  }),

  sessionIdSchema: yup.object({
    params: yup.object({
      sessionId: objectId.required("sessionId is required"),
    }),
  }),

  listSchema: yup.object({
    query: queryObject,
    body: bodyObject,
  }),

  bodySchema: yup.object({
    body: bodyObject,
  }),

  uploadBodySchema: yup.object({
    body: bodyObject,
  }),

  jobBodySchema: yup.object({
    params: params.jobId,
    body: bodyObject,
  }),

  applicationBodySchema: yup.object({
    params: params.applicationId,
    body: bodyObject,
  }),

  interviewBodySchema: yup.object({
    params: params.interviewId,
    body: bodyObject,
  }),

  invitationBodySchema: yup.object({
    params: params.invitationId,
    body: bodyObject,
  }),

  memberBodySchema: yup.object({
    params: params.memberId,
    body: bodyObject,
  }),

  questionBodySchema: yup.object({
    params: params.questionId,
    body: bodyObject,
  }),

  templateBodySchema: yup.object({
    params: params.templateId,
    body: bodyObject,
  }),

  ticketBodySchema: yup.object({
    params: params.ticketId,
    body: bodyObject,
  }),

  requestBodySchema: yup.object({
    params: params.requestId,
    body: bodyObject,
  }),

  employeeBodySchema: yup.object({
    params: params.employeeId,
    body: bodyObject,
  }),

  campusStudentDetailSchema: yup.object({
    params: params.employeeId,
  }),

  campusPartnerDetailSchema: yup.object({
    params: params.universityId,
  }),

  campusPartnerCancelSchema: yup.object({
    params: params.universityId,
    body: bodyObject.shape({
      note: yup.string().trim().max(2000),
      company_note: yup.string().trim().max(2000),
    }),
  }),

  fileDeleteSchema: yup.object({
    params: params.filename,
  }),

  profileSectionSchema: yup.object({
    params: params.profileSection,
    body: bodyObject,
  }),

  profileSectionItemSchema: yup.object({
    params: params.profileSectionItem,
    body: bodyObject,
  }),

  bulkSchema: yup.object({
    body: idsBody,
  }),

  applicationStatusSchema: yup.object({
    params: params.applicationId,
    body: bodyObject.shape({
      status: yup.string().trim().max(120),
      reason: yup.string().trim().max(2000),
      note: yup.string().trim().max(2000),
      message: yup.string().trim().max(5000),
      visible_to_candidate: boolish,
    }),
  }),

  interviewCreateSchema: yup.object({
    body: bodyObject.shape({
      application_id: objectId,
      job_id: objectId,
      employee_user_id: objectId,
      start_at: yup.string().trim().max(120),
      end_at: yup.string().trim().max(120),
      status: yup.string().trim().max(120),
      type: yup.string().trim().max(120),
      timezone: yup.string().trim().max(120),
      meeting_provider: yup.string().trim().max(120),
      meeting_join_instructions: yup.string().trim().max(2000),
      calendar_provider: yup.string().trim().max(120),
      calendar_event_id: yup.string().trim().max(500),
      meet_link: yup.string().trim().max(1000),
      office_address: yup.string().trim().max(1000),
      company_note: yup.string().trim().max(5000),
      candidate_note: yup.string().trim().max(5000),
      scorecard: bodyObject,
    }),
  }),

  interviewFeedbackSchema: yup.object({
    params: params.interviewId,
    body: bodyObject.shape({
      strengths: yup.string().trim().max(5000),
      concerns: yup.string().trim().max(5000),
      next_step: yup.string().trim().max(2000),
      nextStep: yup.string().trim().max(2000),
      result_note: yup.string().trim().max(5000),
      note: yup.string().trim().max(5000),
      rating: yup.number().min(1).max(5),
      scorecard: bodyObject,
    }),
  }),

  interviewReminderSchema: yup.object({
    params: params.interviewId,
    body: bodyObject.shape({
      kind: yup.string().trim().max(120),
      reminder_kind: yup.string().trim().max(120),
      type: yup.string().trim().max(120),
      channel: yup.mixed(),
      channels: yup.mixed(),
      note: yup.string().trim().max(2000),
      respect_preferences: boolish,
      respectPreferences: boolish,
    }),
  }),

  invitationCreateSchema: yup.object({
    params: yup.object({ jobId: objectId }),
    body: bodyObject,
  }),

  talentJobBodySchema: yup.object({
    params: yup.object({ jobId: objectId }),
    body: bodyObject,
    query: queryObject,
  }),

  talentPoolListSchema: yup.object({
    query: queryObject.shape({
      source: yup.string().trim().max(80),
      tag: yup.string().trim().max(120),
      tags: yup.string().trim().max(500),
    }),
    body: bodyObject,
  }),

  talentPoolCandidateCreateSchema: yup.object({
    body: bodyObject.shape({
      application_id: objectId,
      applicationId: objectId,
      source_application_id: objectId,
      employee_id: objectId,
      employeeId: objectId,
      user_id: objectId,
      userId: objectId,
      source: yup.string().trim().max(80),
      rating: yup.number().min(1).max(5),
      tags: yup.mixed(),
    }),
  }),

  talentPoolCandidateSchema: yup.object({
    params: params.candidateId,
  }),

  talentPoolCandidateUpdateSchema: yup.object({
    params: params.candidateId,
    body: bodyObject.shape({
      status: yup.string().trim().max(80),
      rating: yup.number().nullable().min(1).max(5),
      tags: yup.mixed(),
    }),
  }),

  talentPoolCandidateNoteSchema: yup.object({
    params: params.candidateId,
    body: bodyObject.shape({
      note: yup.string().trim().max(4000),
      message: yup.string().trim().max(4000),
      body: yup.string().trim().max(4000),
      visibility: yup.string().trim().max(80),
    }),
  }),

  talentPoolCandidateTagsSchema: yup.object({
    params: params.candidateId,
    body: bodyObject.shape({
      tag: yup.string().trim().max(80),
      tags: yup.mixed(),
    }),
  }),

  talentPoolCandidateTagDeleteSchema: yup.object({
    params: params.candidateTag,
  }),

  talentPoolCandidateInviteSchema: yup.object({
    params: params.candidateId,
    body: bodyObject.shape({
      job_id: objectId,
      jobId: objectId,
      message: yup.string().trim().max(3000),
      salary_offer: yup.string().trim().max(500),
      salaryOffer: yup.string().trim().max(500),
      starts_at: yup.string().trim().max(120),
      expires_at: yup.string().trim().max(120),
    }),
  }),

  talentPoolDoNotContactSchema: yup.object({
    params: params.candidateId,
    body: bodyObject.shape({
      note: yup.string().trim().max(2000),
    }),
  }),

  companyPublicProfileSchema: yup.object({
    body: bodyObject.shape({
      slug: yup.string().trim().max(180),
      logo: yup.string().trim().max(1000),
      cover_image: yup.string().trim().max(1000),
      description: yup.string().trim().max(1500),
      company_short_description: yup.string().trim().max(200),
      mission: yup.string().trim().max(300),
      vision: yup.string().trim().max(300),
      culture: yup.string().trim().max(300),
      benefits: yup.mixed(),
      specialties: yup.mixed(),
      gallery: yup.mixed(),
      company_website: yup.string().trim().max(1000),
      social_links: yup.mixed(),
      socialLinks: yup.mixed(),
      seo_title: yup.string().trim().max(180),
      seo_description: yup.string().trim().max(300),
      hiring_process: yup.string().trim().max(1000),
      why_work_with_us: yup.string().trim().max(1000),
    }),
  }),

  salaryInsightCheckSchema: yup.object({
    body: bodyObject
      .shape({
        title: yup.string().trim().max(180),
        job_title: yup.string().trim().max(180),
        city: yup.string().trim().max(120),
        country: yup.string().trim().max(120),
        currency_code: yup.string().trim().max(12),
        currency: yup.string().trim().max(12),
        currency_rate_snapshot: money,
        min: money,
        max: money,
        salary_min: money,
        salary_max: money,
        salary: bodyObject,
        experience_level_id: objectId,
        industry_id: objectId,
      })
      .test(
        "salary-check-title-and-range",
        "title and salary range are required",
        (value = {}) =>
          Boolean(value.title || value.job_title) &&
          Boolean(value.min || value.max || value.salary_min || value.salary_max || value.salary?.min || value.salary?.max),
      ),
  }),

  salaryInsightSuggestSchema: yup.object({
    query: queryObject.shape({
      title: yup.string().trim().max(180),
      job_title: yup.string().trim().max(180),
      city: yup.string().trim().max(120),
      country: yup.string().trim().max(120),
      currency_code: yup.string().trim().max(12),
      currency: yup.string().trim().max(12),
      experience_level_id: objectId,
      industry_id: objectId,
    }),
  }),
};

export default schemas;
