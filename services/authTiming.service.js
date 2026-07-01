// Constant-time helper for login endpoints so a "user not found" response
// takes the same wall-clock time as a "user found + wrong password"
// response. Without this the attacker can tell whether an email is
// registered by measuring the response latency — the not-found branch
// skips bcrypt entirely and returns in single-digit ms, while the wrong-
// password branch pays ~100ms for the bcryptjs.compare().

import bcryptjs from "bcryptjs";

// A real bcrypt(2a) hash of the string "not-a-real-password". Precomputed at
// module load so the fake compare runs the same PBKDF work as a real one.
// Recomputed lazily to survive process forks / cluster mode.
let DUMMY_HASH = null;

const ensureDummyHash = async () => {
  if (DUMMY_HASH) return DUMMY_HASH;
  DUMMY_HASH = await bcryptjs.hash("not-a-real-password", 10);
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
