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

const frequency = yup.string().trim().oneOf(["instant", "daily", "weekly", "off"]);
const scope = yup.string().trim().oneOf(["seeker", "campus"]);

const filtersShape = {
  keyword: yup.string().trim().max(200),
  q: yup.string().trim().max(200),
  search: yup.string().trim().max(200),
  city: yup.string().trim().max(120),
  country: yup.string().trim().max(120),
  company: yup.string().trim().max(160),
  category: yup.string().trim().max(120),
  date_posted: yup.string().trim().max(40),
  job_type: yup.string().trim().max(80),
  experience: yup.string().trim().max(80),
  salary: yup.string().trim().max(80),
  work_mode: yup.string().trim().max(80),
  deadline: yup.string().trim().max(80),
  job_type_id: objectId,
  work_mode_id: objectId,
  experience_level_id: objectId,
  salary_min: yup.number().min(0).max(100000000000),
  salary_max: yup.number().min(0).max(100000000000),
  currency_code: yup.string().trim().max(12),
  is_remote: boolish,
  easy_apply: boolish,
  is_for_students: boolish,
  is_for_fresh_graduates: boolish,
  verified_employer: boolish,
  company_id: objectId,
};

const filters = bodyObject.shape(filtersShape);

const channels = bodyObject.shape({
  in_app: boolish,
  push: boolish,
  email: boolish,
  sms: boolish,
  manual_whatsapp: boolish,
});

const savedSearchBody = bodyObject.shape({
  name: yup.string().trim().max(160),
  scope,
  filters,
  ...filtersShape,
  frequency,
  channels,
  is_active: boolish,
  created_from: yup.string().trim().oneOf(["search", "migration", "onboarding"]),
});

const filterSource = (body = {}) => ({
  ...(body.filters && typeof body.filters === "object" && !Array.isArray(body.filters) ? body.filters : {}),
  ...Object.fromEntries(Object.keys(filtersShape).filter((key) => body[key] !== undefined).map((key) => [key, body[key]])),
});

const hasFilter = (body = {}) => {
  const source = filterSource(body);
  return Object.values(source).some((value) => {
    if (value === undefined || value === null) return false;
    if (typeof value === "string") return value.trim().length > 0;
    return true;
  });
};

const listQuery = yup.object({
  page: yup.number().integer().min(1).max(100000),
  limit: yup.number().integer().min(1).max(100),
  q: yup.string().trim().max(200),
  search: yup.string().trim().max(200),
  scope,
  frequency,
  status: yup.string().trim().oneOf(["active", "inactive"]),
});

const schemas = {
  listSchema: yup.object({
    query: listQuery,
    body: bodyObject,
  }),

  createSchema: yup.object({
    body: savedSearchBody.test(
      "saved-search-filter-required",
      "At least one saved-search filter is required",
      hasFilter,
    ),
  }),

  updateSchema: yup.object({
    params: yup.object({
      id: objectId.required("id is required"),
    }),
    body: savedSearchBody,
  }),

  idSchema: yup.object({
    params: yup.object({
      id: objectId.required("id is required"),
    }),
    body: bodyObject,
  }),

  runNowSchema: yup.object({
    params: yup.object({
      id: objectId.required("id is required"),
    }),
    query: yup.object({
      limit: yup.number().integer().min(1).max(50),
    }),
    body: bodyObject.shape({
      limit: yup.number().integer().min(1).max(50),
    }),
  }),

  logsSchema: yup.object({
    query: yup.object({
      page: yup.number().integer().min(1).max(100000),
      limit: yup.number().integer().min(1).max(100),
      saved_search_id: objectId,
      status: yup.string().trim().oneOf(["queued", "sent", "skipped", "failed"]),
    }),
    body: bodyObject,
  }),
};

export default schemas;
