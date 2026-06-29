import yup from "yup";

const objectIdRe = /^[a-f\d]{24}$/i;
const slugRe = /^[a-z0-9][a-z0-9_-]{1,120}$/i;
const safeKeyRe = /^[A-Za-z0-9_.-]+$/;
const unsafeKeys = new Set(["__proto__", "prototype", "constructor"]);

const objectId = yup.string().trim().matches(objectIdRe, "Invalid ObjectId");
const idOrSlug = yup
  .string()
  .trim()
  .max(140)
  .test(
    "valid-id-or-slug",
    "Invalid resource id or slug",
    (value) => !value || objectIdRe.test(value) || slugRe.test(value),
  );

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

const safeObject = yup
  .object()
  .test(
    "safe-object-keys",
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

const dateish = yup.mixed().test("valid-date", "Invalid date", (value) => {
  if (value === undefined || value === null || value === "") return true;
  return !Number.isNaN(new Date(value).getTime());
});

const listQuery = yup.object({
  page: yup.number().integer().min(1).max(100000),
  limit: yup.number().integer().min(1).max(100),
  q: yup.string().trim().max(200),
  search: yup.string().trim().max(200),
  type: yup
    .string()
    .trim()
    .oneOf([
      "article",
      "video",
      "template",
      "checklist",
      "course",
      "guide",
      "interview_questions",
      "career_path",
    ]),
  audience: yup
    .string()
    .trim()
    .oneOf([
      "all",
      "students",
      "fresh_graduates",
      "job_seekers",
      "universities",
      "companies",
    ]),
  difficulty: yup
    .string()
    .trim()
    .oneOf(["beginner", "intermediate", "advanced"]),
  category_id: objectId,
  tag: yup.string().trim().max(80),
  status: yup.string().trim().oneOf(["draft", "published", "archived"]),
  visibility: yup
    .string()
    .trim()
    .oneOf(["public", "students", "university_private", "draft"]),
  university_id: objectId,
  lang: yup.string().trim().max(16),
});

const localizedText = yup
  .mixed()
  .test("valid-localized-text", "Localized text must be a string or object", (value) => {
    if (value === undefined || value === null) return true;
    if (typeof value === "string") return value.length <= 20000;
    if (typeof value !== "object" || Array.isArray(value)) return false;
    if (hasUnsafePayloadKey(value)) return false;
    return ["ar", "en"].every(
      (key) => value[key] === undefined || String(value[key]).length <= 20000,
    );
  });

const stringList = yup
  .mixed()
  .test("valid-string-list", "Must be a list of short strings", (value) => {
    if (value === undefined || value === null || value === "") return true;
    const values = Array.isArray(value) ? value : String(value).split(/[,;]+/);
    return values.length <= 100 && values.every((item) => String(item).trim().length <= 120);
  });

const objectIdList = yup
  .mixed()
  .test("valid-object-id-list", "Must be valid ObjectIds", (value) => {
    if (value === undefined || value === null || value === "") return true;
    const values = Array.isArray(value) ? value : [value];
    return values.length <= 100 && values.every((item) => objectIdRe.test(String(item).trim()));
  });

const resourceBody = bodyObject.shape({
  key: yup.string().trim().max(120).matches(slugRe),
  slug: yup.string().trim().max(140).matches(slugRe),
  type: yup
    .string()
    .trim()
    .oneOf([
      "article",
      "video",
      "template",
      "checklist",
      "course",
      "guide",
      "interview_questions",
      "career_path",
    ]),
  audience: stringList,
  title: localizedText,
  title_en: yup.string().trim().max(500),
  title_ar: yup.string().trim().max(500),
  summary: localizedText,
  summary_en: yup.string().trim().max(2000),
  summary_ar: yup.string().trim().max(2000),
  body: localizedText,
  body_en: yup.string().trim().max(20000),
  body_ar: yup.string().trim().max(20000),
  content: yup.string().trim().max(20000),
  category_ids: objectIdList,
  tags: stringList,
  language: yup.string().trim().oneOf(["ar", "en", "both"]),
  media_url: yup.string().trim().max(2000),
  file_url: yup.string().trim().max(2000),
  cover_image: yup.string().trim().max(2000),
  estimated_minutes: yup.number().integer().min(1).max(10000),
  difficulty: yup
    .string()
    .trim()
    .oneOf(["beginner", "intermediate", "advanced"]),
  source_type: yup.string().trim().oneOf(["platform", "university", "company"]),
  university_id: objectId,
  company_id: objectId,
  visibility: yup
    .string()
    .trim()
    .oneOf(["public", "students", "university_private", "draft"]),
  status: yup.string().trim().oneOf(["draft", "published", "archived"]),
  featured: boolish,
  sort_order: yup.number().integer().min(-100000).max(100000),
  metadata: safeObject,
});

const categoryBody = bodyObject.shape({
  key: yup.string().trim().max(120).matches(slugRe).required("key is required"),
  slug: yup.string().trim().max(140).matches(slugRe),
  title: localizedText,
  title_en: yup.string().trim().max(500),
  title_ar: yup.string().trim().max(500),
  description: localizedText,
  description_en: yup.string().trim().max(2000),
  description_ar: yup.string().trim().max(2000),
  icon: yup.string().trim().max(120),
  sort_order: yup.number().integer().min(-100000).max(100000),
  status: yup.string().trim().oneOf(["active", "archived"]),
});

const categoryPatchBody = bodyObject.shape({
  key: yup.string().trim().max(120).matches(slugRe),
  slug: yup.string().trim().max(140).matches(slugRe),
  title: localizedText,
  title_en: yup.string().trim().max(500),
  title_ar: yup.string().trim().max(500),
  description: localizedText,
  description_en: yup.string().trim().max(2000),
  description_ar: yup.string().trim().max(2000),
  icon: yup.string().trim().max(120),
  sort_order: yup.number().integer().min(-100000).max(100000),
  status: yup.string().trim().oneOf(["active", "archived"]),
});

const schemas = {
  resourceListSchema: yup.object({
    query: listQuery,
    body: bodyObject,
  }),

  resourceDetailSchema: yup.object({
    params: yup.object({
      idOrSlug: idOrSlug.required("idOrSlug is required"),
    }),
    query: listQuery,
    body: bodyObject,
  }),

  resourceIdSchema: yup.object({
    params: yup.object({
      id: idOrSlug.required("id is required"),
    }),
    body: bodyObject,
  }),

  resourceProgressSchema: yup.object({
    params: yup.object({
      id: idOrSlug.required("id is required"),
    }),
    body: bodyObject.shape({
      progress_percent: yup.number().min(0).max(100),
      progress: yup.number().min(0).max(100),
      status: yup.string().trim().oneOf(["not_started", "in_progress", "completed"]),
    }),
  }),

  resourceRecommendationSchema: yup.object({
    query: yup.object({
      limit: yup.number().integer().min(1).max(50),
      lang: yup.string().trim().max(16),
    }),
    body: bodyObject,
  }),

  learningResourceCreateSchema: yup.object({
    body: resourceBody,
  }),

  learningResourceUpdateSchema: yup.object({
    params: yup.object({
      id: objectId.required("id is required"),
    }),
    body: resourceBody,
  }),

  learningResourceIdSchema: yup.object({
    params: yup.object({
      id: objectId.required("id is required"),
    }),
    body: bodyObject,
  }),

  learningResourceStatusSchema: yup.object({
    params: yup.object({
      id: objectId.required("id is required"),
    }),
    body: bodyObject.shape({
      visibility: yup
        .string()
        .trim()
        .oneOf(["public", "students", "university_private", "draft"]),
      status: yup.string().trim().oneOf(["draft", "published", "archived"]),
    }),
  }),

  learningResourceDeleteSchema: yup.object({
    params: yup.object({
      id: objectId.required("id is required"),
    }),
    body: bodyObject,
  }),

  resourceCategoryCreateSchema: yup.object({
    body: categoryBody,
  }),

  resourceCategoryUpdateSchema: yup.object({
    params: yup.object({
      id: objectId.required("id is required"),
    }),
    body: categoryPatchBody,
  }),

  universityResourceAssignSchema: yup.object({
    params: yup.object({
      id: objectId.required("id is required"),
    }),
    body: bodyObject.shape({
      audience: stringList,
      required: boolish,
      due_at: dateish,
      note: yup.string().trim().max(2000),
    }),
  }),
};

export default schemas;
