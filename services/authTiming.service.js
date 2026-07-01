// Constant-time helper for login endpoints so a "user not found" response
// takes the same wall-clock time as a "user found + wrong password"
// response. Without this the attacker can tell whether an email is
// registered by measuring the response latency — the not-found branch
// skips bcrypt entirely and returns in single-digit ms, while the wrong-
// password branch pays ~100ms for the bcryptjs.compare().

import bcryptjs from "bcrypt";

// The dummy hash must be computed at the SAME cost as the real password
// hashes in the DB — otherwise the wall-clock time for the "user not
// found" branch drifts from the "wrong password" branch and the timing
// side channel opens back up.
//
// Every issuer in the codebase currently uses cost 10; when that changes,
// bump BCRYPT_COST too and CI will catch drift via the smoke-import test.
const BCRYPT_COST = Number.parseInt(process.env.BCRYPT_COST || "10", 10) || 10;

let DUMMY_HASH = null;

const ensureDummyHash = async () => {
  if (DUMMY_HASH) return DUMMY_HASH;
  DUMMY_HASH = await bcryptjs.hash("not-a-real-password", BCRYPT_COST);
  return DUMMY_HASH;
};

// Kick off the initial hash at import time so the first request doesn't pay
// for it. Fire-and-forget — the fallback path in burnBcryptCycles awaits it
// if the request beats the initial hash.
ensureDummyHash().catch(() => {
  /* re-attempted on demand */
});

// Call from the "user not found" branch of a login flow. Awaits a bcrypt
// compare that will always return false. Discard the return value — the
// point is only the timing side effect.
export const burnBcryptCycles = async (candidatePassword) => {
  const hash = await ensureDummyHash();
  try {
    await bcryptjs.compare(String(candidatePassword || ""), hash);
  } catch (_) {
    /* even the failure has the right shape */
  }
};
