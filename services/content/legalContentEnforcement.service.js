export const LEGAL_CONTENT_ENFORCEMENT_MODES = Object.freeze([
  "staging",
  "production",
]);

export const LEGAL_REVIEW_APPROVED_STATUS = "lawyer_approved";

export const LEGAL_REVIEW_STATUSES = Object.freeze([
  "draft",
  "needs_lawyer_review",
  "revision_requested",
  "rejected",
  LEGAL_REVIEW_APPROVED_STATUS,
]);

export const REQUIRED_PRODUCTION_LEGAL_PAGE_KEYS = Object.freeze([
  "about_us",
  "contact_information",
  "terms_and_conditions",
  "job_seeker_guidelines",
  "employer_terms",
  "university_partner_terms",
  "campus_student_terms",
  "acceptable_use_content_policy",
  "community_guidelines",
  "anti_discrimination_policy",
  "trust_safety_policy",
  "legal_reports",
  "copyright_ip_policy",
  "privacy_policy",
  "cookies_policy",
  "privacy_choices",
  "account_data_deletion_policy",
  "cv_uploaded_files_policy",
  "student_data_document_visibility_policy",
  "recommendations_automated_systems_policy",
  "communications_notification_policy",
  "accessibility_statement",
  "payment_refund_policy",
  "subscription_terms",
  "external_apply_third_party_links_policy",
  "salary_currency_job_info_disclaimer",
]);

const REQUIRED_PRODUCTION_LEGAL_PAGE_KEY_SET = new Set(
  REQUIRED_PRODUCTION_LEGAL_PAGE_KEYS,
);

const clean = (value) => String(value || "").trim().toLowerCase();

export const legalContentEnforcementMode = (env = process.env) => {
  const configured = clean(env.LEGAL_CONTENT_ENFORCEMENT_MODE || "staging");
  return LEGAL_CONTENT_ENFORCEMENT_MODES.includes(configured)
    ? configured
    : "staging";
};

export const isProductionLegalContentEnforcement = (options = {}) =>
  clean(options.mode || legalContentEnforcementMode(options.env)) ===
  "production";

export const isRequiredProductionLegalPage = (pageOrKey) => {
  const key =
    typeof pageOrKey === "string" ? pageOrKey : String(pageOrKey?.key || "");
  return REQUIRED_PRODUCTION_LEGAL_PAGE_KEY_SET.has(key);
};

export const isLegalReviewApproved = (page = {}) =>
  clean(page.legalReviewStatus) === LEGAL_REVIEW_APPROVED_STATUS;

export const isPublicLegalPageVisible = (page = {}, options = {}) => {
  if (!isProductionLegalContentEnforcement(options)) return true;
  if (!isRequiredProductionLegalPage(page)) return true;
  return isLegalReviewApproved(page);
};

export const filterPublicLegalContent = (pages = [], options = {}) =>
  pages.filter((page) => isPublicLegalPageVisible(page, options));

export const productionLegalApprovalFailures = (pages = []) => {
  const byKey = new Map(pages.map((page) => [page.key, page]));
  return REQUIRED_PRODUCTION_LEGAL_PAGE_KEYS.flatMap((key) => {
    const page = byKey.get(key);
    if (!page) return [{ key, status: "missing" }];
    if (isLegalReviewApproved(page)) return [];
    return [{ key, status: page.legalReviewStatus || "missing" }];
  });
};

export default {
  LEGAL_CONTENT_ENFORCEMENT_MODES,
  LEGAL_REVIEW_APPROVED_STATUS,
  LEGAL_REVIEW_STATUSES,
  REQUIRED_PRODUCTION_LEGAL_PAGE_KEYS,
  filterPublicLegalContent,
  isLegalReviewApproved,
  isProductionLegalContentEnforcement,
  isPublicLegalPageVisible,
  isRequiredProductionLegalPage,
  legalContentEnforcementMode,
  productionLegalApprovalFailures,
};
