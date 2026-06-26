import assert from "node:assert/strict";
import {
  AI_FEATURES,
  buildAiSafetyPayload,
  hashAiInput,
  normalizeAiFeatureKey,
} from "../services/ai/aiSafety.service.js";

const requiredFeatures = [
  "career_copilot",
  "profile_score",
  "cv_rewrite",
  "job_match_explanation",
  "job_cover_letter",
  "interview_practice",
  "company_job_generate",
  "company_shortlist",
  "company_message_generate",
  "translate_job",
  "translate_cv",
];

assert.deepEqual(Object.keys(AI_FEATURES).sort(), requiredFeatures.sort());
assert.equal(normalizeAiFeatureKey("Cover Letter"), "cover_letter");
assert.equal(normalizeAiFeatureKey("job-cover-letter"), "job_cover_letter");

const hashA = hashAiInput({ b: 2, a: { y: 1, x: 0 } });
const hashB = hashAiInput({ a: { x: 0, y: 1 }, b: 2 });
assert.equal(hashA, hashB, "AI input hashes must be stable across object key order");

const payload = buildAiSafetyPayload({
  feature: "job_cover_letter",
  requestId: "request-1",
  reason: "ai_feature_not_enabled",
});

assert.equal(payload.ai_status.status, "blocked");
assert.equal(payload.ai_status.reason, "ai_feature_not_enabled");
assert.equal(payload.safety.suggestion_only, true);
assert.equal(payload.safety.human_approval_required, true);
assert.equal(payload.safety.auto_action_performed, false);
assert.equal(payload.output, null);

for (const [feature, config] of Object.entries(AI_FEATURES)) {
  assert.ok(config.required_account, `${feature} must declare its account guard`);
  assert.ok(Array.isArray(config.output_keys), `${feature} must declare output keys`);
  assert.ok(config.output_keys.length > 0, `${feature} output keys cannot be empty`);
}

console.log("AI safety contract verified.");
