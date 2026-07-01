// Unit tests for services/cvPublicToken.service.js.
// Run: node --test test/unit/cvPublicToken.test.js

import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";

const {
  hashCvPublicToken,
  verifyCvPublicToken,
  isHashedCvPublicToken,
} = await import("../../services/cvPublicToken.service.js");

test("hashCvPublicToken returns 64-char hex", () => {
  const h = hashCvPublicToken(randomBytes(24).toString("hex"));
  assert.match(h, /^[a-f0-9]{64}$/);
  assert.equal(isHashedCvPublicToken(h), true);
});

test("hashCvPublicToken is deterministic", () => {
  const t = "abcdef1234567890";
  assert.equal(hashCvPublicToken(t), hashCvPublicToken(t));
});

test("verifyCvPublicToken matches token against its hash", () => {
  const token = randomBytes(24).toString("hex");
  const hash = hashCvPublicToken(token);
  assert.equal(verifyCvPublicToken(token, hash), true);
  assert.equal(verifyCvPublicToken(token + "0", hash), false);
});

test("verifyCvPublicToken supports legacy plaintext rows", () => {
  // Rows written before P1-05 stored the raw token — must keep working.
  const legacyStored = "legacy-plain-token-123";
  assert.equal(verifyCvPublicToken(legacyStored, legacyStored), true);
  assert.equal(verifyCvPublicToken("different", legacyStored), false);
});

test("verifyCvPublicToken rejects empty inputs", () => {
  assert.equal(verifyCvPublicToken("", "abc"), false);
  assert.equal(verifyCvPublicToken("abc", ""), false);
  assert.equal(verifyCvPublicToken(null, null), false);
});

test("verifyCvPublicToken length-mismatched hex compares to false", () => {
  const token = randomBytes(24).toString("hex");
  const hash = hashCvPublicToken(token);
  // Trim to 63 chars → same shape but wrong length.
  assert.equal(verifyCvPublicToken(token, hash.slice(0, 63)), false);
});
