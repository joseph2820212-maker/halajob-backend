// OTP passcode hashing + timing-safe comparison.
//
// The old flow stored the raw 5-digit code in user.passcode and compared it
// with String(user.passcode) === String(passcode).trim(). Two problems:
//   1. Anyone with DB read (backups, replica, ops scripts) could reuse every
//      in-flight OTP inside its 10-minute window.
//   2. The string comparison is not timing-safe; measurable but low impact
//      given the 90k-code space.
//
// This helper writes an HMAC-SHA256 of the code (keyed with PASSCODE_SECRET
// or JWT_SECRET as a fallback so the deploy doesn't need a second env yet),
// and verifies via crypto.timingSafeEqual over equal-length buffers.
//
// It also generates 6-digit codes now (was 5 = ~90k space; 6 = 900k).

import crypto from "crypto";

// Resolve the HMAC key at every call rather than once at module import
// time. Scripts, seeders, and test harnesses often import controllers
// before dotenv.config() has run — capturing SECRET at import time meant
// hashPasscode silently used the empty string as the key, producing a
// hash that verifyPasscode could never match after env vars later
// populated. Lazy resolution keeps every caller in step with the live
// env and lets us fail loudly if neither PASSCODE_SECRET nor JWT_SECRET
// is set at the moment we actually need to hash.
const resolveSecret = () => {
  const s = process.env.PASSCODE_SECRET || process.env.JWT_SECRET || "";
  if (!s || s.length < 16) {
    throw new Error(
      "passcodeHash: neither PASSCODE_SECRET nor JWT_SECRET is set to " +
        "a >= 16-char value. Refusing to hash — a short/empty key means the " +
        "OTP hash is trivially reversible via a 900k rainbow of inputs.",
    );
  }
  return s;
};

// New codes are 6 digits. Legacy 5-digit codes issued before this deploy
// remain valid until they expire (max 10 min after the deploy landed).
const OTP_MIN = 100000;
const OTP_MAX = 1000000;

export const generatePasscode = () =>
  String(crypto.randomInt(OTP_MIN, OTP_MAX));

// HMAC-SHA256 hex → 64 chars. If we ever see a stored value that isn't 64
// hex chars we assume it's a legacy plaintext code and fall back to a
// timing-safe string compare (equalized length) so pending OTPs still work
// after this deploy lands.
const HEX64_RE = /^[a-f0-9]{64}$/i;

export const hashPasscode = (code) => {
  if (!code) return "";
  return crypto
    .createHmac("sha256", resolveSecret())
    .update(String(code).trim())
    .digest("hex");
};

const timingSafeStringEqual = (a, b) => {
  const A = Buffer.from(String(a));
  const B = Buffer.from(String(b));
  // timingSafeEqual requires equal length; pad the shorter side with zeros
  // in constant time and still return false.
  const maxLen = Math.max(A.length, B.length, 1);
  const AA = Buffer.alloc(maxLen);
  const BB = Buffer.alloc(maxLen);
  A.copy(AA);
  B.copy(BB);
  const equal = crypto.timingSafeEqual(AA, BB);
  return equal && A.length === B.length;
};

export const verifyPasscode = (candidate, stored) => {
  if (!candidate || !stored) return false;
  const cand = String(candidate).trim();
  const storedStr = String(stored).trim();
  if (HEX64_RE.test(storedStr)) {
    const candHash = hashPasscode(cand);
    return timingSafeStringEqual(candHash, storedStr);
  }
  // Legacy path: plaintext code, still in the DB from before this deploy.
  return timingSafeStringEqual(cand, storedStr);
};

export const isHashedPasscode = (value) =>
  typeof value === "string" && HEX64_RE.test(value);
