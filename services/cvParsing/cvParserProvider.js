import { normalizeCvParseResult } from "./cvParseNormalizer.js";

const providerName = () =>
  String(process.env.CV_PARSER_PROVIDER || "manual").trim().toLowerCase();

export const parseCvUpload = async ({ file }) => {
  const provider = providerName();

  if (!file) {
    return {
      provider: "manual",
      status: "failed",
      confidence: 0,
      normalized_result: {},
      error_code: "cv_file_required",
      error_message: "CV file is required.",
    };
  }

  if (!["local", "external"].includes(provider)) {
    return {
      provider: "manual",
      status: "failed",
      confidence: 0,
      normalized_result: {},
      error_code: "cv_parser_not_configured",
      error_message: "CV parsing provider is not configured. Upload was saved for manual review.",
    };
  }

  return {
    provider,
    status: "failed",
    confidence: 0,
    raw_result: {},
    normalized_result: normalizeCvParseResult({}),
    error_code: "cv_parser_not_configured",
    error_message: "Configured parser adapter is not available in this build.",
  };
};

export default {
  parseCvUpload,
};
