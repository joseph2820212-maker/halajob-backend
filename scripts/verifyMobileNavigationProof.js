import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { existsRepoPath, readRepoFile } from "./utils/repoPaths.js";

const root = process.cwd();
const manifestPath = path.join(root, "docs/testing/mobile-navigation-proof.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const sourceCache = new Map();
const failures = [];

function readSource(relativePath) {
  if (!existsRepoPath(relativePath)) {
    failures.push(`${relativePath} does not exist`);
    return "";
  }
  if (!sourceCache.has(relativePath)) {
    sourceCache.set(relativePath, readRepoFile(relativePath));
  }
  return sourceCache.get(relativePath);
}

function extractNamedTest(source, testName, label) {
  const nameIndex = source.indexOf(testName);
  if (nameIndex < 0) {
    failures.push(`${label} missing test: ${testName}`);
    return "";
  }
  const startCandidates = [
    source.lastIndexOf("\n  testWidgets(", nameIndex),
    source.lastIndexOf("\n  test(", nameIndex),
  ].filter((index) => index >= 0);
  const start = startCandidates.length ? Math.max(...startCandidates) : nameIndex;
  const nextWidgetTest = source.indexOf("\n  testWidgets(", nameIndex + testName.length);
  const nextUnitTest = source.indexOf("\n  test(", nameIndex + testName.length);
  const positiveEnds = [nextWidgetTest, nextUnitTest].filter((index) => index >= 0);
  const end = positiveEnds.length ? Math.min(...positiveEnds) : source.length;
  return source.slice(start, end);
}

function extractExactInventoryKeys(scope, callName, label) {
  const callIndex = scope.indexOf(callName);
  if (callIndex < 0) {
    failures.push(`${label} missing exact inventory call: ${callName}`);
    return [];
  }
  const listStart = scope.indexOf("[", callIndex);
  const listEnd = scope.indexOf("]);", listStart);
  if (listStart < 0 || listEnd < 0) {
    failures.push(`${label} has an unreadable exact inventory list`);
    return [];
  }
  const block = scope.slice(listStart, listEnd);
  return Array.from(
    block.matchAll(/'((?:quick-action|company-module)-[^']+)'/g),
    (match) => match[1],
  );
}

function requireContains(source, needle, label) {
  if (!source.includes(needle)) failures.push(`${label} missing: ${needle}`);
}

function requireNotEmptyArray(value, label) {
  if (!Array.isArray(value) || value.length === 0) {
    failures.push(`${label} must be a non-empty array`);
    return false;
  }
  return true;
}

assert.equal(manifest.version, 1, "mobile navigation proof manifest version");
requireNotEmptyArray(manifest.surfaces, "surfaces");

let verifiedCards = 0;
let verifiedSurfaces = 0;
let verifiedFlows = 0;

for (const surface of manifest.surfaces || []) {
  const label = surface.label || surface.id || "unnamed surface";
  const source = readSource(surface.sourcePath);
  const proof = readSource(surface.proofPath);
  if (!source || !proof) continue;

  const inventoryScope = surface.inventoryTestName
    ? extractNamedTest(proof, surface.inventoryTestName, label)
    : "";
  const destinationScope = surface.destinationTestName
    ? extractNamedTest(proof, surface.destinationTestName, label)
    : inventoryScope;
  let actualInventoryKeys = [];

  if (surface.exactInventoryCall) {
    actualInventoryKeys = extractExactInventoryKeys(
      inventoryScope,
      surface.exactInventoryCall,
      label,
    );
    try {
      assert.deepEqual(actualInventoryKeys, surface.expectedVisibleKeys || []);
    } catch {
      failures.push(
        `${label} exact inventory mismatch:\n` +
          `  expected ${JSON.stringify(surface.expectedVisibleKeys || [])}\n` +
          `  actual   ${JSON.stringify(actualInventoryKeys)}`,
      );
    }
  }

  if (Array.isArray(surface.expectedVisibleKeys)) {
    const declaredCardKeys = (surface.cards || []).map((card) => card.uiKey);
    if (declaredCardKeys.length > 0) {
      try {
        assert.deepEqual(declaredCardKeys, surface.expectedVisibleKeys);
      } catch {
        failures.push(
          `${label} card list does not match expected visible keys:\n` +
            `  expected ${JSON.stringify(surface.expectedVisibleKeys)}\n` +
            `  cards    ${JSON.stringify(declaredCardKeys)}`,
        );
      }
    }
  }

  for (const absentKey of surface.absentVisibleKeys || []) {
    if (actualInventoryKeys.length && !actualInventoryKeys.includes(absentKey)) {
      continue;
    }
    requireContains(
      inventoryScope,
      `ValueKey('${absentKey}')`,
      `${label} absent-card proof`,
    );
    requireContains(inventoryScope, "findsNothing", `${label} absent-card proof`);
  }

  for (const card of surface.cards || []) {
    const cardLabel = `${label} card ${card.id || card.uiKey}`;
    for (const expected of card.sourceMustContain || []) {
      requireContains(source, expected, `${cardLabel} source`);
    }
    const proofScope = destinationScope || inventoryScope || proof;
    const uiProofScope = [inventoryScope, destinationScope, proofScope].join("\n");
    requireContains(uiProofScope, card.uiKey, `${cardLabel} UI key proof`);
    for (const expected of card.proofMustContain || []) {
      requireContains(proofScope, expected, `${cardLabel} destination proof`);
    }
    verifiedCards += 1;
  }

  verifiedSurfaces += 1;
}

for (const proof of manifest.flowProofs || []) {
  const label = proof.label || proof.id || "unnamed flow proof";
  const source = readSource(proof.proofPath);
  if (!source) continue;
  const scope = extractNamedTest(source, proof.testName, label);
  for (const expected of proof.mustContain || []) {
    requireContains(scope, expected, label);
  }
  verifiedFlows += 1;
}

if (failures.length) {
  console.error("Mobile navigation proof verification failed:");
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(
  `Mobile navigation proof verified for ${verifiedCards} cards across ${verifiedSurfaces} surfaces and ${verifiedFlows} flow proofs.`,
);
