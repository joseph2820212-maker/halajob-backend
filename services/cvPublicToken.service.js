// Small helper for the CV public-download token. Keeps the SHA-256 +
// timing-safe compare shape in one place so the app.js handler and the
// generateCv issue-time code use the same encoding.
//
// Threat model closed: anyone who could read the EmployeeCv collection
// (DB backups, replica, misplaced ops shell) previously walked away with
// working share links. Storing sha256(token) means the DB no longer holds
// anything usable.

import crypto from "crypto";

const HEX64_RE = /^[a-f0-9]{64}$/i;

export const hashCvPublicToken = (token) => {
  if (!token) return "";
  return crypto.createHash("sha256").update(String(token).trim()).digest("hex");
};

export const isHashedCvPublicToken = (value) =>
  typeof value === "string" && HEX64_RE.test(value);

// Timing-safe compare of a candidate token against a stored value that may
// be either the SHA-256 hex (new format) or the raw token (legacy rows).
// Legacy rows keep working for one release cycle; issue-time hashing means
// no fresh rows arrive plain.
export const verifyCvPublicToken = (candidate, storedValue) => {
  if (!candidate || !storedValue) return false;
  const cand = String(candidate).trim();
  const stored = String(storedValue).trim();

  if (isHashedCvPublicToken(stored)) {
    const candHash = hashCvPublicToken(cand);
    const A = Buffer.from(candHash);
    const B = Buffer.from(stored);
    if (A.length !== B.length) return false;
    return crypto.timingSafeEqual(A, B);
  }

  // Legacy: pre-hash row. Constant-time string equality.
  const A = Buffer.from(cand);
  const B = Buffer.from(stored);
  if (A.length !== B.length) return false;
  return crypto.timingSafeEqual(A, B);
};
