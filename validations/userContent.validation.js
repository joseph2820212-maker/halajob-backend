// Validation schemas for the user-facing privacy / support / legal-report
// endpoints. Shaped as yup.object({ body, params }) for middlewares/validate.js.
// These enforce presence/shape/length; controllers still enforce enum specifics
// against the Mongoose models.
import yup from "yup";

const reqStr = (max) => {
  let s = yup.string().trim().required();
  if (max) s = s.max(max);
  return s;
};
const optStr = (max) => {
  let s = yup.string().trim();
  if (max) s = s.max(max);
  return s;
};
const idParam = yup.string().trim().required();

// --- Privacy ---
export const privacyRequestSchema = yup.object({
  body: yup.object({
    type: reqStr(64),
    details: optStr(2000),
  }),
});

export const setConsentSchema = yup.object({
  params: yup.object({ purpose: reqStr(64) }),
  body: yup.object({
    granted: yup.mixed().notRequired(),
    source: optStr(16),
  }),
});

export const acknowledgePolicySchema = yup.object({
  params: yup.object({ pageKey: reqStr(120) }),
  body: yup.object({
    version: reqStr(40),
    source: optStr(16),
  }),
});

export const accessibilityRequestSchema = yup.object({
  body: yup.object({
    message: reqStr(2000),
    area: optStr(64),
    email: yup.string().trim().email().max(160).notRequired(),
  }),
});

// --- Support ---
export const supportCreateTicketSchema = yup.object({
  body: yup.object({
    subject: reqStr(200),
    message: reqStr(5000),
    category: optStr(64),
    source: optStr(16),
  }),
});

export const supportAddMessageSchema = yup.object({
  body: yup.object({ message: reqStr(5000) }),
});

export const supportTicketIdParamSchema = yup.object({
  params: yup.object({ id: idParam }),
});

// --- Legal report ---
export const legalReportSchema = yup.object({
  body: yup.object({
    reason: reqStr(64),
    targetType: optStr(64),
    targetId: optStr(64),
    description: optStr(4000),
    email: yup.string().trim().email().max(160).notRequired(),
  }),
});

export default {
  privacyRequestSchema,
  setConsentSchema,
  acknowledgePolicySchema,
  accessibilityRequestSchema,
  supportCreateTicketSchema,
  supportAddMessageSchema,
  supportTicketIdParamSchema,
  legalReportSchema,
};
