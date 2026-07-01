import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const metadataPath = join(
  root,
  "mobile",
  "dist",
  "android",
  "halajob-mobile-latest-debug.apk.json",
);
const proofDocPath = join(
  root,
  "docs",
  "testing",
  "MOBILE_WEB_CONTRACT_TEST_RESULTS.md",
);
const readinessReportPath = join(root, "docs", "HALAJOB_9_5_FINAL_COMPLETION_REPORT.md");
const traceabilityPath = join(root, "docs", "HALAJOB_9_5_HANDOUT_TRACEABILITY.md");

if (!existsSync(metadataPath)) {
  console.log("Mobile APK proof check skipped; no latest debug APK metadata found.");
  process.exit(0);
}

const metadata = JSON.parse(readFileSync(metadataPath, "utf8"));
const proofDoc = readFileSync(proofDocPath, "utf8");
const readinessReport = readFileSync(readinessReportPath, "utf8");
const traceability = readFileSync(traceabilityPath, "utf8");

const commit = String(metadata.gitCommit || "").trim();
const shortCommit = commit.slice(0, 7);
const sha256 = String(metadata.sha256 || "").trim().toLowerCase();
const latestArtifactPath = String(metadata.latestArtifactPath || "").trim();
const latestShaPath = `${latestArtifactPath}.sha256`;
const diagnosticsLabel = `${metadata.buildName} (${metadata.buildNumber}) | ${metadata.buildTarget} | ${shortCommit} | ${metadata.campusAuthMode}`;

assert.match(commit, /^[0-9a-f]{40}$/i, "APK metadata must include a full git commit.");
assert.match(sha256, /^[0-9a-f]{64}$/i, "APK metadata must include a SHA-256 hash.");
assert.equal(metadata.buildTarget, "debug-apk", "Latest APK proof must describe a debug APK.");
assert.equal(metadata.diagnosticsEnabled, true, "Tester APK must have diagnostics enabled.");
assert.equal(metadata.campusAuthMode, "local-device", "Tester APK must keep local campus auth enabled.");
assert.equal(metadata.aiToolsEnabled, true, "Tester APK must expose AI tools for review.");
assert.ok(existsSync(latestArtifactPath), `Latest APK artifact is missing: ${latestArtifactPath}`);
assert.ok(existsSync(latestShaPath), `Latest APK SHA file is missing: ${latestShaPath}`);

const shaFileValue = readFileSync(latestShaPath, "utf8").trim().toLowerCase();
assert.equal(shaFileValue, sha256, "APK metadata SHA and .sha256 file must match.");

[
  `Latest APK source build commit: \`${shortCommit}\``,
  `debug APK from source commit \`${shortCommit}\``,
  `diagnostics showing \`${diagnosticsLabel}\``,
  `SHA-256 \`${sha256}\``,
  "Documentation commits after",
].forEach((needle) => {
  assert.ok(proofDoc.includes(needle), `APK proof doc is missing: ${needle}`);
});

[
  `Current APK source build commit: \`${shortCommit}\``,
  `source commit \`${shortCommit}\``,
  `Version/build: \`${metadata.versionLabel}\``,
  `SHA-256: \`${sha256}\``,
  `diagnostics showing \`${diagnosticsLabel}\``,
].forEach((needle) => {
  assert.ok(readinessReport.includes(needle), `Readiness report is missing: ${needle}`);
});

[
  `Current tester APK source | \`${shortCommit}\``,
  `Current tester APK SHA-256 | \`${sha256}\``,
].forEach((needle) => {
  assert.ok(traceability.includes(needle), `Handout traceability is missing: ${needle}`);
});

console.log(`Mobile APK proof matches latest debug APK metadata for ${shortCommit}.`);
