import yup from "yup";

const objectIdRe = /^[a-f\d]{24}$/i;
const safeKeyRe = /^[A-Za-z0-9_.-]+$/;
const unsafeKeys = new Set(["__proto__", "prototype", "constructor"]);

const objectId = yup.string().trim().matches(objectIdRe, "Invalid ObjectId");
const safeSegment = yup.string().trim().matches(/^[A-Za-z0-9_.-]{1,180}$/, "Invalid path segment");

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
    (value) => !hasUnsafePayloadKey(value)
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

const idsBody = bodyObject.shape({
  ids: yup.mixed(),
  job_ids: yup.mixed(),
  application_ids: yup.mixed(),
});

const params = {
  jobId: yup.object({ jobId: objectId.required("jobId is required") }),
  applicationId: yup.object({ applicationId: objectId.required("applicationId is required") }),
  interviewId: yup.object({ interviewId: objectId.required("interviewId is required") }),
  invitationId: yup.object({ invitationId: objectId.required("invitationId is required") }),
  memberId: yup.object({ memberId: objectId.required("memberId is required") }),
  questionId: yup.object({ questionId: objectId.required("questionId is required") }),
  templateId: yup.object({ templateId: objectId.required("templateId is required") }),
  ticketId: yup.object({ ticketId: objectId.required("ticketId is required") }),
  requestId: yup.object({ requestId: objectId.required("requestId is required") }),
  employeeId: yup.object({ employeeId: objectId.required("employeeId is required") }),
  filename: yup.object({ filename: safeSegment.required("filename is required") }),
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
      meet_link: yup.string().trim().max(1000),
      office_address: yup.string().trim().max(1000),
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
};

export default schemas;
