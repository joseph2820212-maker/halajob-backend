import { normalizeCvParseResult } from "./cvParseNormalizer.js";
import {
  extractRawText,
  extractFieldsFromText,
  scoreConfidence,
} from "./localCvTextExtractor.js";

const providerName = () =>
  String(process.env.CV_PARSER_PROVIDER || "manual").trim().toLowerCase();

const parseLocally = async (file) => {
  let raw;
  try {
    raw = await extractRawText(file);
  } catch (error) {
    return {
      provider: "local",
      status: "failed",
      confidence: 0,
      normalized_result: normalizeCvParseResult({}),
      error_code: "cv_parser_read_failed",
      error_message: error?.message || "Could not read the uploaded CV file.",
    };
  }

  if (raw.unsupported || !raw.text.trim()) {
    return {
      provider: "local",
      status: "failed",
      confidence: 0,
      normalized_result: normalizeCvParseResult({}),
      error_code: "cv_parser_unsupported_format",
      error_message:
        "The local parser supports plain text and DOCX files. Upload was saved for manual review.",
    };
  }

  const fields = extractFieldsFromText(raw.text);
  const confidence = scoreConfidence(fields);

  return {
    provider: "local",
    status: confidence > 0 ? "parsed" : "failed",
    confidence,
    raw_result: { text: raw.text.slice(0, 20000) },
    normalized_result: normalizeCvParseResult(fields),
    ...(confidence > 0
      ? {}
      : {
          error_code: "cv_parser_low_confidence",
          error_message:
            "Could not extract structured details from this CV. Upload was saved for manual review.",
        }),
  };
};

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

  if (provider === "local") {
    return parseLocally(file);
  }

  if (provider !== "external") {
    return {
      provider: "manual",
      status: "failed",
      confidence: 0,
      normalized_result: {},
      error_code: "cv_parser_not_configured",
      error_message: "CV parsing provider is not configured. Upload was saved for manual review.",
    };
  }

  // External providers require API credentials that are not bundled with this
  // build (owner-provisioned). Keep the upload for manual review.
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
