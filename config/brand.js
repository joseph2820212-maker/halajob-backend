// Central brand constants. The public product name is "Hala Job" everywhere a
// user, company, university, admin, tester, or investor can see it.
//
// Hala Job is operated by llill ltd; the public web domain is halajob.com.
// The backend API domain may temporarily remain jobzain.com (live backend) —
// that is a technical URL, never presented as the product brand. See
// BRAND_CLEANUP_AUDIT.md.
const brand = Object.freeze({
  PRODUCT_NAME: "Hala Job",
  SUPPORT_NAME: "Hala Job Support",
  TALENT_SUPPORT_NAME: "Hala Job Talent Support",
  DEFAULT_EMAIL_FROM_NAME: "Hala Job",
  PUBLIC_SITE_NAME: "Hala Job",
});

export const {
  PRODUCT_NAME,
  SUPPORT_NAME,
  TALENT_SUPPORT_NAME,
  DEFAULT_EMAIL_FROM_NAME,
  PUBLIC_SITE_NAME,
} = brand;

export default brand;
