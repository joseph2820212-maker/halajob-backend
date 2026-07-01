import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { existsRepoPath, readRepoFile } from "./utils/repoPaths.js";

const root = process.cwd();
const manifestPath = path.join(root, "docs/testing/mobile-action-key-coverage.json");
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

function extractLiterals(source) {
  const values = [];
  const literalRegex = /(['"])((?:\\.|(?!\1)[\s\S])*?)\1/g;
  let match;
  while ((match = literalRegex.exec(source))) {
    values.push(match[2]);
  }
  return values;
}

function uniqueSorted(values) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

function isConcreteKey(value, prefixes) {
  return (
    prefixes.some((prefix) => value.startsWith(prefix)) &&
    !value.includes("${") &&
    !value.includes("$")
  );
}

function proofContains(key, proofPaths) {
  return proofPaths.some((proofPath) => readSource(proofPath).includes(key));
}

function requireProof(key, proofPaths, label) {
  if (!proofContains(key, proofPaths)) {
    failures.push(`${label} key has no test/contract proof: ${key}`);
  }
}

assert.equal(manifest.version, 1, "mobile action key coverage manifest version");
assert.ok(Array.isArray(manifest.sources), "sources must be an array");
assert.ok(Array.isArray(manifest.dynamicProofs), "dynamicProofs must be an array");

let staticKeyCount = 0;
let dynamicKeyCount = 0;

for (const entry of manifest.sources) {
  const label = entry.label || entry.sourcePath || "unnamed source";
  const source = readSource(entry.sourcePath);
  const prefixes = entry.prefixes || [];
  const proofPaths = entry.proofPaths || [];
  if (!prefixes.length) failures.push(`${label} must declare prefixes`);
  if (!proofPaths.length) failures.push(`${label} must declare proofPaths`);

  const keys = uniqueSorted(
    extractLiterals(source).filter((value) => isConcreteKey(value, prefixes)),
  );
  if (!keys.length) failures.push(`${label} did not expose any concrete keys`);
  for (const key of keys) requireProof(key, proofPaths, label);
  staticKeyCount += keys.length;
}

for (const proof of manifest.dynamicProofs) {
  const label = proof.label || proof.sourcePath || "unnamed dynamic proof";
  const source = readSource(proof.sourcePath);
  const proofPaths = proof.proofPaths || [];
  if (!proofPaths.length) failures.push(`${label} must declare proofPaths`);

  for (const expected of proof.sourceMustContain || []) {
    if (!source.includes(expected)) {
      failures.push(`${label} source is missing dynamic key family: ${expected}`);
    }
  }
  for (const key of proof.expectedKeys || []) {
    requireProof(key, proofPaths, label);
    dynamicKeyCount += 1;
  }
}

if (failures.length) {
  console.error("Mobile action-key coverage verification failed:");
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(
  `Mobile action-key coverage verified for ${staticKeyCount} static keys and ${dynamicKeyCount} dynamic key proofs.`,
);
