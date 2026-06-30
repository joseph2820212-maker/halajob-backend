import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const contract = JSON.parse(
  readFileSync("docs/testing/function-placement-contract.json", "utf8"),
);
const doc = readFileSync(contract.document, "utf8");

for (const section of contract.requiredSections) {
  assert.ok(doc.includes(section), `Missing placement-map section: ${section}`);
}

for (const phrase of contract.requiredPhrases) {
  assert.ok(doc.includes(phrase), `Missing placement-map rule: ${phrase}`);
}

for (const [role, functions] of Object.entries(contract.requiredRoleFunctions)) {
  for (const fn of functions) {
    assert.ok(
      doc.includes(fn),
      `Missing placement-map function for ${role}: ${fn}`,
    );
  }
}

assert.ok(
  doc.includes("Feature Gates") && doc.includes("Known Gaps"),
  "Placement map must preserve feature-gate and known-gap context.",
);

console.log("Function placement map contract verified.");
