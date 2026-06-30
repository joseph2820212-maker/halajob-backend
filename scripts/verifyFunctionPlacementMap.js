import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const contract = JSON.parse(
  readFileSync("docs/testing/function-placement-contract.json", "utf8"),
);
const doc = readFileSync(contract.document, "utf8");

function countOccurrences(source, needle) {
  let count = 0;
  let index = 0;
  while (index < source.length) {
    const next = source.indexOf(needle, index);
    if (next === -1) break;
    count += 1;
    index = next + needle.length;
  }
  return count;
}

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

for (const rule of contract.sourceOccurrences || []) {
  const source = readFileSync(rule.path, "utf8");
  const count = countOccurrences(source, rule.text);
  if (typeof rule.equals === "number") {
    assert.equal(
      count,
      rule.equals,
      `${rule.path} expected ${rule.equals} occurrence(s) of ${JSON.stringify(
        rule.text,
      )} but found ${count}`,
    );
  }
  if (typeof rule.min === "number") {
    assert.ok(
      count >= rule.min,
      `${rule.path} expected at least ${rule.min} occurrence(s) of ${JSON.stringify(
        rule.text,
      )} but found ${count}`,
    );
  }
  if (typeof rule.max === "number") {
    assert.ok(
      count <= rule.max,
      `${rule.path} expected at most ${rule.max} occurrence(s) of ${JSON.stringify(
        rule.text,
      )} but found ${count}`,
    );
  }
}

console.log("Function placement map contract verified.");
