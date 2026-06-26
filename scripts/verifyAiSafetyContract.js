import assert from "node:assert/strict";
import {
  AI_FEATURES,
  buildAiSafetyPayload,
  buildAiProviderPrompt,
  createMockAiOutput,
  estimateAiProviderCost,
  hashAiInput,
  normalizeAiFeatureKey,
  normalizeAiProviderName,
  normalizeAiProviderOutput,
  parseAiProviderJson,
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
assert.equal(normalizeAiProviderName("OpenAI Compatible"), "openai_compatible");
assert.equal(normalizeAiProviderName(" mock "), "mock");

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

  const mockOutput = createMockAiOutput({
    feature,
    outputKeys: config.output_keys,
    input: { body: { title: "Test title" } },
  });
  assert.deepEqual(
    Object.keys(mockOutput).sort(),
    [...config.output_keys].sort(),
    `${feature} mock output must match the declared output keys`
  );

  const normalizedOutput = normalizeAiProviderOutput({
    feature,
    output: { [config.output_keys[0]]: "present", unexpected: true },
  });
  assert.deepEqual(
    Object.keys(normalizedOutput).sort(),
    [...config.output_keys].sort(),
    `${feature} provider output must be normalized to declared keys`
  );
}

const providerPrompt = buildAiProviderPrompt({
  feature: "company_shortlist",
  outputKeys: AI_FEATURES.company_shortlist.output_keys,
});
assert.ok(providerPrompt.includes("Return only a valid JSON object"));
assert.ok(providerPrompt.includes("suggestion-only"));
assert.ok(providerPrompt.includes("protected characteristics"));

assert.deepEqual(parseAiProviderJson('{"score":72}'), { score: 72 });
assert.deepEqual(parseAiProviderJson('```json\n{"score":72}\n```'), { score: 72 });

process.env.HALA_AI_INPUT_COST_PER_1M_TOKENS = "1";
process.env.HALA_AI_OUTPUT_COST_PER_1M_TOKENS = "3";
assert.equal(
  estimateAiProviderCost({ prompt_tokens: 500000, completion_tokens: 250000 }),
  1.25,
  "AI cost estimate must use configurable per-million token pricing"
);
delete process.env.HALA_AI_INPUT_COST_PER_1M_TOKENS;
delete process.env.HALA_AI_OUTPUT_COST_PER_1M_TOKENS;

console.log("AI safety contract verified.");
