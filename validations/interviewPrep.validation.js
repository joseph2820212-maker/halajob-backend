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

const localizedText = yup
  .mixed()
  .test("valid-localized-text", "Localized text must be a string or object", (value) => {
    if (value === undefined || value === null) return true;
    if (typeof value === "string") return value.length <= 4000;
    if (typeof value !== "object" || Array.isArray(value)) return false;
    if (hasUnsafePayloadKey(value)) return false;
    return ["ar", "en"].every(
      (key) => value[key] === undefined || String(value[key]).length <= 4000,
    );
  });

const hasLocalizedContent = (body = {}, field) => {
  const direct = body[field];
  if (typeof direct === "string" && direct.trim()) return true;
  if (direct && typeof direct === "object" && !Array.isArray(direct)) {
    if (String(direct.en || "").trim() || String(direct.ar || "").trim()) return true;
  }
  return Boolean(
    String(body[`${field}_en`] || "").trim() ||
      String(body[`${field}_ar`] || "").trim(),
  );
};

const stringList = yup
  .mixed()
  .test("valid-string-list", "Must be a list of short strings", (value) => {
    if (value === undefined || value === null || value === "") return true;
    const values = Array.isArray(value) ? value : String(value).split(/[,;]+/);
    return values.length <= 100 && values.every((item) => String(item).trim().length <= 120);
  });

const listQuery = yup.object({
  page: yup.number().integer().min(1).max(100000),
  limit: yup.number().integer().min(1).max(100),
  q: yup.string().trim().max(200),
  search: yup.string().trim().max(200),
  category: yup.string().trim().max(120),
  difficulty: yup.string().trim().oneOf(["basic", "medium", "advanced"]),
  job_name_id: objectId,
  industry_id: objectId,
  tag: yup.string().trim().max(120),
  status: yup.string().trim().oneOf(["draft", "published", "archived"]),
  lang: yup.string().trim().max(16),
});

const questionBody = bodyObject.shape({
  title: localizedText,
  title_en: yup.string().trim().max(500),
  title_ar: yup.string().trim().max(500),
  question: localizedText,
  question_en: yup.string().trim().max(4000),
  question_ar: yup.string().trim().max(4000),
  answer_tips: localizedText,
  answer_tips_en: yup.string().trim().max(4000),
  answer_tips_ar: yup.string().trim().max(4000),
  category: yup.string().trim().max(120),
  job_name_id: objectId,
  industry_id: objectId,
  audience: stringList,
  difficulty: yup.string().trim().oneOf(["basic", "medium", "advanced"]),
  tags: stringList,
  status: yup.string().trim().oneOf(["draft", "published", "archived"]),
});

const schemas = {
  listSchema: yup.object({
    query: listQuery,
    body: bodyObject,
  }),

  jobPrepSchema: yup.object({
    params: yup.object({
      jobId: objectId.required("jobId is required"),
    }),
    query: listQuery,
    body: bodyObject,
  }),

  questionIdSchema: yup.object({
    params: yup.object({
      id: objectId.required("id is required"),
    }),
    body: bodyObject,
  }),

  saveNoteSchema: yup.object({
    params: yup.object({
      id: objectId.required("id is required"),
    }),
    body: bodyObject.shape({
      note: yup.string().trim().max(4000),
      saved: yup.boolean(),
      status: yup.string().trim().oneOf(["not_started", "in_progress", "completed"]),
      progress_percent: yup.number().min(0).max(100),
    }),
  }),

  checklistProgressSchema: yup.object({
    params: yup.object({
      id: objectId.required("id is required"),
    }),
    body: bodyObject.shape({
      job_id: objectId,
      progress: yup.number().min(0).max(100),
      progress_percent: yup.number().min(0).max(100),
      status: yup.string().trim().oneOf(["not_started", "in_progress", "completed"]),
    }),
  }),

  questionCreateSchema: yup.object({
    body: questionBody.test(
      "question-required",
      "Question text is required",
      (value) => hasLocalizedContent(value, "question"),
    ),
  }),

  questionUpdateSchema: yup.object({
    params: yup.object({
      id: objectId.required("id is required"),
    }),
    body: questionBody,
  }),

  questionDeleteSchema: yup.object({
    params: yup.object({
      id: objectId.required("id is required"),
    }),
    body: bodyObject,
  }),
};

export default schemas;
