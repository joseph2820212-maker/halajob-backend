// Unit tests for services/passcodeHash.service.js.
// Run: node --test test/unit/passcodeHash.test.js

import test from "node:test";
import assert from "node:assert/strict";

process.env.PASSCODE_SECRET = "test-secret-do-not-use-in-prod";

const { generatePasscode, hashPasscode, verifyPasscode, isHashedPasscode } =
  await import("../../services/passcodeHash.service.js");

test("generatePasscode returns 6-digit string", () => {
  for (let i = 0; i < 50; i++) {
    const code = generatePasscode();
    assert.equal(typeof code, "string");
    assert.match(code, /^\d{6}$/);
  }
});

test("hashPasscode returns 64-char hex", () => {
  const h = hashPasscode("123456");
  assert.match(h, /^[a-f0-9]{64}$/);
  assert.equal(isHashedPasscode(h), true);
});

test("hashPasscode is deterministic with same secret", () => {
  const a = hashPasscode("123456");
  const b = hashPasscode("123456");
  assert.equal(a, b);
});

test("hashPasscode differs across different codes", () => {
  const a = hashPasscode("123456");
  const b = hashPasscode("123457");
  assert.notEqual(a, b);
});

test("verifyPasscode accepts correct code against hash", () => {
  const code = "654321";
  const hash = hashPasscode(code);
  assert.equal(verifyPasscode(code, hash), true);
});

test("verifyPasscode rejects wrong code against hash", () => {
  const hash = hashPasscode("654321");
  assert.equal(verifyPasscode("654322", hash), false);
});

test("verifyPasscode falls back to plaintext for legacy rows", () => {
  // Simulates a row created before the migration where the stored value
  // is the raw 5-digit code and not a 64-char hash.
  const legacyStored = "12345";
  assert.equal(verifyPasscode("12345", legacyStored), true);
  assert.equal(verifyPasscode("12346", legacyStored), false);
});

test("verifyPasscode returns false for empty inputs", () => {
  assert.equal(verifyPasscode("", "abc"), false);
  assert.equal(verifyPasscode("abc", ""), false);
  assert.equal(verifyPasscode(null, null), false);
  assert.equal(verifyPasscode(undefined, "abc"), false);
});

test("verifyPasscode trims whitespace on candidate", () => {
  const code = "111111";
  const hash = hashPasscode(code);
  assert.equal(verifyPasscode("  111111  ", hash), true);
});
