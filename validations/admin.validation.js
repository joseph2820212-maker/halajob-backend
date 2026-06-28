import yup from "yup";

const objectIdRe = /^[a-f\d]{24}$/i;
const resourceRe = /^[A-Za-z][A-Za-z0-9_-]{0,80}$/;
const safeKeyRe = /^[A-Za-z0-9_.-]+$/;
const unsafeKeys = new Set(["__proto__", "prototype", "constructor"]);

const objectId = yup.string().trim().matches(objectIdRe, "Invalid ObjectId");
const resource = yup.string().trim().matches(resourceRe, "Invalid resource name");

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

const dateish = yup
  .mixed()
  .test("valid-date", "Invalid date", (value) => {
    if (value === undefined || value === null || value === "") return true;
    return !Number.isNaN(new Date(value).getTime());
  });

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

const safeObject = yup
  .object()
  .test(
    "safe-object-keys",
    "Payload contains unsafe field names",
    (value) => !hasUnsafePayloadKey(value)
  );

const paramsWithOptionalResource = yup.object({
  resource,
  id: objectId,
});

const paramsWithRequiredResource = yup.object({
  resource: resource.required("resource is required"),
  id: objectId,
});

const idParamsWithOptionalResource = yup.object({
  resource,
  id: objectId.required("id is required"),
});

const idParamsWithRequiredResource = yup.object({
  resource: resource.required("resource is required"),
  id: objectId.required("id is required"),
});

const idParam = yup.object({
  id: objectId.required("id is required"),
});

const jobIdParam = yup.object({
  jobId: objectId.required("jobId is required"),
});

const ticketIdParam = yup.object({
  ticketId: objectId.required("ticketId is required"),
});

const companyIdParam = yup.object({
  companyId: objectId.required("companyId is required"),
});

const listQuery = yup
  .object({
    page: yup.number().integer().min(1).max(100000),
    limit: yup.number().integer().min(1).max(200),
    sort: yup.string().trim().max(160),
    search: yup.string().trim().max(200),
    keyword: yup.string().trim().max(200),
    q: yup.string().trim().max(200),
    from: yup.date(),
    to: yup.date(),
    created_from: yup.date(),
    created_to: yup.date(),
    createdAt_from: yup.date(),
    createdAt_to: yup.date(),
    updated_from: yup.date(),
    updated_to: yup.date(),
    ids: yup.string().trim().max(4000),
  })
  .test(
    "safe-query-keys",
    "Query contains unsafe field names",
    (value) => !hasUnsafePayloadKey(value)
  );

const bulkIds = yup
  .mixed()
  .required("ids are required")
  .test("valid-ids", "ids must be valid ObjectIds", (value) => {
    const values = Array.isArray(value)
      ? value
      : String(value || "")
          .split(/[\s,;]+/)
          .filter(Boolean);
    return (
      values.length > 0 &&
      values.length <= 500 &&
      values.every((id) => objectIdRe.test(String(id).trim()))
    );
  });

const forceDelete = yup
  .mixed()
  .test(
    "valid-force",
    "force must be a boolean",
    (value) =>
      value === undefined ||
      value === true ||
      value === false ||
      value === "true" ||
      value === "false"
  );

const idList = yup
  .mixed()
  .test("valid-object-id-list", "ids must be valid ObjectIds", (value) => {
    if (value === undefined || value === null || value === "") return true;
    const values = Array.isArray(value) ? value : [value];
    return (
      values.length <= 500 &&
      values.every((item) => objectIdRe.test(String(item?._id || item).trim()))
    );
  });

const dashboardLoginBody = bodyObject.shape({
  email: yup.string().trim().required("Email or phone is required"),
  password: yup.string().required("Password is required"),
});

const refreshBody = bodyObject.shape({
  refreshToken: yup.string().trim(),
  refresh_token: yup.string().trim(),
  rotate: boolish,
});

const dashboardUserBody = bodyObject.shape({
  first_name: yup.string().trim().required("first_name is required"),
  mid_name: yup.string().trim().nullable(),
  last_name: yup.string().trim().required("last_name is required"),
  email: yup.string().trim().email().required("email is required"),
  password: yup.string().min(8).max(128).required("password is required"),
  gender: yup.string().trim().oneOf(["male", "female", "other"]),
  role_id: objectId,
  role_name: yup.string().trim().max(120),
  phone_code: yup.string().trim().max(8),
  phone_country: yup.string().trim().max(8),
  phone_national: yup.string().trim().max(32),
  permissions: yup.mixed().test("valid-permissions", "permissions must be an array", (value) => {
    if (value === undefined) return true;
    return Array.isArray(value);
  }),
  status: boolish,
});

const aiLimitBody = bodyObject.shape({
  feature: yup.string().trim().max(100),
  scope_type: yup.string().trim().oneOf(["global", "user", "context", "company", "university"]),
  scopeType: yup.string().trim().oneOf(["global", "user", "context", "company", "university"]),
  scope_id: yup.string().trim().max(120),
  scopeId: yup.string().trim().max(120),
  enabled: boolish,
  daily_limit: yup.number().integer().min(0).max(100000),
  dailyLimit: yup.number().integer().min(0).max(100000),
  monthly_limit: yup.number().integer().min(0).max(1000000),
  monthlyLimit: yup.number().integer().min(0).max(1000000),
  provider: yup.string().trim().max(80),
  model: yup.string().trim().max(120),
  note: yup.string().trim().max(500),
  admin_note: yup.string().trim().max(500),
  is_active: boolish,
  active: boolish,
});

const notificationBody = bodyObject.shape({
  user_ids: idList,
  users: idList,
  recipients: idList,
  user_id: objectId,
  recipient_id: objectId,
  event_key: yup.string().trim().max(120),
  event: yup.string().trim().max(120),
  title: yup.string().trim().max(160),
  body: yup.string().trim().max(2000),
  message: yup.string().trim().max(2000),
  audience: yup.string().trim().max(80),
  route_key: yup.string().trim().max(120),
  screen: yup.string().trim().max(120),
  route_params: safeObject,
  routeParams: safeObject,
  params: safeObject,
  data: safeObject,
  save: boolish,
  push: boolish,
  dedupe_key: yup.string().trim().max(180),
  dedupeKey: yup.string().trim().max(180),
});

const supportStatusBody = bodyObject.shape({
  status: yup.string().trim().max(64).required("status is required"),
  priority: yup.string().trim().max(64),
  assigned_to: yup.mixed().test("valid-assigned-to", "assigned_to must be an ObjectId", (value) => {
    if (value === undefined || value === null || value === "") return true;
    return objectIdRe.test(String(value).trim());
  }),
  admin_note: yup.string().trim().max(2000),
  note: yup.string().trim().max(2000),
});

const supportMessageBody = bodyObject.shape({
  message: yup.string().trim().max(5000).required("message is required"),
  attachments: yup.mixed(),
  files: yup.mixed(),
});

const approveCompanyBody = bodyObject.shape({
  company_id: objectId,
  is_verified: boolish,
  plan_id: objectId,
  subscription_plan_id: objectId,
  plan_key: yup.string().trim().max(120),
  subscription_plan_key: yup.string().trim().max(120),
  starts_at: dateish,
  ends_at: dateish,
  admin_note: yup.string().trim().max(1000),
});

const rejectBody = bodyObject.shape({
  company_id: objectId,
  job_id: objectId,
  reason: yup.string().trim().max(2000),
  message: yup.string().trim().max(2000),
  rejection_reason: yup.string().trim().max(2000),
});

const approveJobBody = bodyObject.shape({
  job_id: objectId,
  publish_status: yup.string().trim().max(64),
  admin_note: yup.string().trim().max(2000),
  note: yup.string().trim().max(2000),
});

const trustActionBody = bodyObject.shape({
  note: yup.string().trim().max(2000),
  admin_note: yup.string().trim().max(2000),
  reason: yup.string().trim().max(2000),
  message: yup.string().trim().max(2000),
});

const talentStatusBody = bodyObject.shape({
  status: yup.string().trim().max(64).required("status is required"),
  admin_note: yup.string().trim().max(2000),
  note: yup.string().trim().max(2000),
});

const assignSubscriptionBody = bodyObject.shape({
  company_id: objectId,
  plan_id: objectId,
  plan_key: yup.string().trim().max(120),
  starts_at: dateish,
  ends_at: dateish,
  status: yup.string().trim().max(64),
  admin_note: yup.string().trim().max(1000),
});

const universityBody = bodyObject.shape({
  name: yup.string().trim().max(200),
  name_en: yup.string().trim().max(200),
  logo: yup.string().trim().max(1000),
  city: yup.string().trim().max(120),
  country: yup.string().trim().max(120),
  email_domain: yup.string().trim().max(200),
  career_center_email: yup.string().trim().email().max(254),
  status: yup.string().trim().oneOf(["active", "pending", "suspended"]),
  students_count: yup.number().integer().min(0).max(10000000),
});

const universityStatusBody = bodyObject.shape({
  status: yup.string().trim().max(64).required("status is required"),
});

const cvTemplateBody = bodyObject.shape({
  key: yup.string().trim().max(120),
  title_ar: yup.string().trim().max(240),
  title_en: yup.string().trim().max(240),
  description_ar: yup.string().trim().max(2000),
  description_en: yup.string().trim().max(2000),
  preview_image: yup.string().trim().max(1000),
  html: yup.string(),
  css: yup.string(),
  default_colors: yup.mixed(),
  default_font: yup.string().trim().max(120),
  supported_languages: yup.mixed(),
  is_active: boolish,
  sort_order: yup.number().integer().min(-100000).max(100000),
});

const keywordInput = yup.object({
  name: yup.string().trim().max(240),
  title_ar: yup.string().trim().max(1000),
  title_en: yup.string().trim().max(1000),
});

const schemas = {
  listResourceSchema: yup.object({
    params: paramsWithOptionalResource,
    query: listQuery,
  }),

  genericListResourceSchema: yup.object({
    params: paramsWithRequiredResource,
    query: listQuery,
  }),

  getResourceSchema: yup.object({
    params: paramsWithOptionalResource,
    query: yup.object({ id: objectId }),
    body: yup.object({ id: objectId }),
  }),

  idResourceSchema: yup.object({
    params: idParamsWithOptionalResource,
  }),

  genericGetResourceSchema: yup.object({
    params: idParamsWithRequiredResource,
  }),

  createResourceSchema: yup.object({
    params: paramsWithOptionalResource,
    body: bodyObject,
  }),

  genericCreateResourceSchema: yup.object({
    params: paramsWithRequiredResource,
    body: bodyObject,
  }),

  updateResourceSchema: yup.object({
    params: idParamsWithOptionalResource,
    body: bodyObject,
  }),

  genericUpdateResourceSchema: yup.object({
    params: idParamsWithRequiredResource,
    body: bodyObject,
  }),

  bulkUpdateResourceSchema: yup.object({
    params: paramsWithOptionalResource,
    body: bodyObject.shape({
      ids: bulkIds,
    }),
  }),

  genericBulkUpdateResourceSchema: yup.object({
    params: paramsWithRequiredResource,
    body: bodyObject.shape({
      ids: bulkIds,
    }),
  }),

  statusResourceSchema: yup.object({
    params: idParamsWithOptionalResource,
    body: bodyObject,
  }),

  genericStatusResourceSchema: yup.object({
    params: idParamsWithRequiredResource,
    body: bodyObject,
  }),

  deleteResourceSchema: yup.object({
    params: idParamsWithOptionalResource,
    query: yup.object({ force: forceDelete }),
    body: yup.object({ id: objectId, force: forceDelete }),
  }),

  genericDeleteResourceSchema: yup.object({
    params: idParamsWithRequiredResource,
    query: yup.object({ force: forceDelete }),
    body: yup.object({ force: forceDelete }),
  }),

  dashboardLoginSchema: yup.object({
    body: dashboardLoginBody,
  }),

  dashboardRefreshSchema: yup.object({
    body: refreshBody.test(
      "refresh-token-present",
      "Refresh token is required",
      (value = {}) => Boolean(value.refreshToken || value.refresh_token)
    ),
  }),

  dashboardLogoutSchema: yup.object({
    body: refreshBody.test(
      "refresh-token-present",
      "Refresh token is required",
      (value = {}) => Boolean(value.refreshToken || value.refresh_token)
    ),
  }),

  dashboardCreateUserSchema: yup.object({
    body: dashboardUserBody.test(
      "role-present",
      "role_id or role_name is required",
      (value = {}) => Boolean(value.role_id || value.role_name)
    ),
  }),

  aiLimitCreateSchema: yup.object({
    body: aiLimitBody.shape({
      feature: yup.string().trim().max(100).required("feature is required"),
    }),
  }),

  aiLimitUpdateSchema: yup.object({
    params: idParam,
    body: aiLimitBody,
  }),

  idOnlySchema: yup.object({
    params: idParam,
  }),

  adminNotificationSendSchema: yup.object({
    body: notificationBody.test(
      "notification-target-and-content",
      "Notification recipients and content are required",
      (value = {}) =>
        Boolean(value.user_ids || value.users || value.recipients || value.user_id || value.recipient_id) &&
        Boolean(value.event_key || value.event || (value.title && (value.body || value.message)))
    ),
  }),

  supportTicketStatusSchema: yup.object({
    params: ticketIdParam,
    body: supportStatusBody,
  }),

  supportTicketMessageSchema: yup.object({
    params: ticketIdParam,
    body: supportMessageBody,
  }),

  companyApprovalSchema: yup.object({
    params: idParam,
    body: approveCompanyBody,
  }),

  companyRejectSchema: yup.object({
    params: idParam,
    body: rejectBody,
  }),

  jobApprovalSchema: yup.object({
    params: idParam,
    body: approveJobBody,
  }),

  jobRejectSchema: yup.object({
    params: idParam,
    body: rejectBody,
  }),

  trustJobActionSchema: yup.object({
    params: jobIdParam,
    body: trustActionBody,
  }),

  talentRequestListSchema: yup.object({
    query: listQuery,
    body: bodyObject,
  }),

  talentRequestStatusSchema: yup.object({
    params: idParam,
    body: talentStatusBody,
  }),

  seedFreePlanSchema: yup.object({
    body: bodyObject,
  }),

  assignSubscriptionPlanSchema: yup.object({
    params: companyIdParam,
    body: assignSubscriptionBody,
  }),

  universityCreateSchema: yup.object({
    body: universityBody.test(
      "university-required-fields",
      "name, email_domain, and career_center_email are required",
      (value = {}) =>
        Boolean(value.name || value.name_en) &&
        Boolean(value.email_domain) &&
        Boolean(value.career_center_email)
    ),
  }),

  universityStatusSchema: yup.object({
    params: idParam,
    body: universityStatusBody,
  }),

  cvTemplateCreateSchema: yup.object({
    body: cvTemplateBody.shape({
      key: yup.string().trim().max(120).required("key is required"),
      title_ar: yup.string().trim().max(240).required("title_ar is required"),
      title_en: yup.string().trim().max(240).required("title_en is required"),
      html: yup.string().required("html is required"),
    }),
  }),

  cvTemplateUpdateSchema: yup.object({
    params: idParam,
    body: cvTemplateBody,
  }),

  keywordUpdateSchema: yup.object({
    params: idParam,
    body: bodyObject.shape({
      inputs: yup.array().of(keywordInput).min(1).required("inputs are required"),
    }),
  }),

  importUploadSchema: yup.object({
    body: bodyObject,
  }),
};

export default schemas;
