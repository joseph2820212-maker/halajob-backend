import assert from "node:assert/strict";
import {
  LEGAL_CONTENT_ENFORCEMENT_MODES,
  LEGAL_REVIEW_APPROVED_STATUS,
  LEGAL_REVIEW_STATUSES,
  REQUIRED_PRODUCTION_LEGAL_PAGE_KEYS,
  filterPublicLegalContent,
  isPublicLegalPageVisible,
  legalContentEnforcementMode,
  productionLegalApprovalFailures,
} from "../services/content/legalContentEnforcement.service.js";

assert.deepEqual(LEGAL_CONTENT_ENFORCEMENT_MODES, ["staging", "production"]);
assert.ok(LEGAL_REVIEW_STATUSES.includes("revision_requested"));
assert.ok(LEGAL_REVIEW_STATUSES.includes("rejected"));
assert.equal(legalContentEnforcementMode({}), "staging");
assert.equal(
  legalContentEnforcementMode({ LEGAL_CONTENT_ENFORCEMENT_MODE: "production" }),
  "production",
);
assert.equal(
  legalContentEnforcementMode({ LEGAL_CONTENT_ENFORCEMENT_MODE: "invalid" }),
  "staging",
);

const approvedPage = {
  key: REQUIRED_PRODUCTION_LEGAL_PAGE_KEYS[0],
  legalReviewStatus: LEGAL_REVIEW_APPROVED_STATUS,
};
const pendingPage = {
  key: REQUIRED_PRODUCTION_LEGAL_PAGE_KEYS[1],
  legalReviewStatus: "needs_lawyer_review",
};
const nonRequiredPage = {
  key: "product_release_notes",
  legalReviewStatus: "needs_lawyer_review",
};

assert.equal(
  isPublicLegalPageVisible(pendingPage, { mode: "staging" }),
  true,
  "staging must allow review drafts to render with their status badge",
);
assert.equal(
  isPublicLegalPageVisible(pendingPage, { mode: "production" }),
  false,
  "production must block required legal pages until lawyer-approved",
);
assert.equal(
  isPublicLegalPageVisible(nonRequiredPage, { mode: "production" }),
  true,
  "production must not block non-required public content",
);
assert.deepEqual(
  filterPublicLegalContent([approvedPage, pendingPage, nonRequiredPage], {
    mode: "production",
  }),
  [approvedPage, nonRequiredPage],
);

const completeApprovedPages = REQUIRED_PRODUCTION_LEGAL_PAGE_KEYS.map((key) => ({
  key,
  legalReviewStatus: LEGAL_REVIEW_APPROVED_STATUS,
}));
assert.deepEqual(productionLegalApprovalFailures(completeApprovedPages), []);

const approvalFailures = productionLegalApprovalFailures([
  ...completeApprovedPages.slice(1),
  pendingPage,
]);
assert.ok(
  approvalFailures.some(
    (item) => item.key === pendingPage.key && item.status === "needs_lawyer_review",
  ),
);
assert.ok(
  approvalFailures.some(
    (item) => item.key === REQUIRED_PRODUCTION_LEGAL_PAGE_KEYS[0] && item.status === "missing",
  ),
);

console.log("Legal content enforcement guard passed.");
