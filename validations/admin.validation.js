import yup from "yup";

const objectIdRe = /^[a-f\d]{24}$/i;
const resourceRe = /^[A-Za-z][A-Za-z0-9_-]{0,80}$/;
const safeKeyRe = /^[A-Za-z0-9_.-]+$/;
const unsafeKeys = new Set(["__proto__", "prototype", "constructor"]);

const objectId = yup.string().trim().matches(objectIdRe, "Invalid ObjectId");
const resource = yup.string().trim().matches(resourceRe, "Invalid resource name");

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
};

export default schemas;
