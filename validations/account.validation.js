import yup from "yup";

const objectId = yup
  .string()
  .trim()
  .matches(/^[a-f\d]{24}$/i, "Invalid ObjectId");

const activeContextBody = yup
  .object({
    context_id: objectId,
    contextId: objectId,
    active_context_id: objectId,
    activeContextId: objectId,
  })
  .noUnknown(true, "Unknown account context field")
  .test(
    "has-context-id",
    "context_id is required",
    (value = {}) =>
      Boolean(
        value.context_id ||
          value.contextId ||
          value.active_context_id ||
          value.activeContextId
      )
  );

const schemas = {
  activeContextSchema: yup.object({
    body: activeContextBody,
  }),

  accountDeletionRequestSchema: yup.object({
    body: yup
      .object({
        reason: yup.string().trim().max(500).nullable(),
      })
      .noUnknown(true, "Unknown account deletion field"),
  }),

  emptyBodySchema: yup.object({
    body: yup.object({}).noUnknown(true, "Unknown account field"),
  }),
};

export default schemas;
