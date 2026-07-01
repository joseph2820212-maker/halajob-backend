import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const CONTRACT = path.join(ROOT, "docs", "testing", "ui-action-contract.json");

const contract = JSON.parse(fs.readFileSync(CONTRACT, "utf8"));
const failures = [];
const sourceCache = new Map();

function readSource(relativePath) {
  const filePath = path.join(ROOT, relativePath);
  if (!fs.existsSync(filePath)) {
    failures.push(`${relativePath} does not exist`);
    return "";
  }
  if (!sourceCache.has(relativePath)) {
    const primarySource = fs.readFileSync(filePath, "utf8");
    const partSources = [];
    const partRe = /^\s*part\s+['"]([^'"]+)['"]\s*;/gm;
    let partMatch;
    while ((partMatch = partRe.exec(primarySource))) {
      const partPath = path.join(path.dirname(filePath), partMatch[1]);
      if (!fs.existsSync(partPath)) {
        failures.push(`${relativePath} declares missing Dart part file: ${partMatch[1]}`);
        continue;
      }
      partSources.push(fs.readFileSync(partPath, "utf8"));
    }
    sourceCache.set(relativePath, [primarySource, ...partSources].join("\n"));
  }
  return sourceCache.get(relativePath);
}

function countOccurrences(source, needle) {
  if (!needle) return 0;
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

function extractScope(source, start, end) {
  const startIndex = source.indexOf(start);
  if (startIndex === -1) return null;
  const endIndex = source.indexOf(end, startIndex + start.length);
  if (endIndex === -1) return source.slice(startIndex);
  return source.slice(startIndex, endIndex);
}

function verifySourceExpectations(entry, labelPrefix = entry.path) {
  const source = readSource(entry.path);
  if (!source) return;
  for (const expected of entry.mustContain || []) {
    if (!source.includes(expected)) {
      failures.push(`${labelPrefix} is missing required action contract string: ${expected}`);
    }
  }
  for (const banned of entry.mustNotContain || []) {
    if (source.includes(banned)) {
      failures.push(`${labelPrefix} contains banned action contract string: ${banned}`);
    }
  }
  for (const rule of entry.occurrences || []) {
    const text = rule.text || "";
    const count = countOccurrences(source, text);
    if (typeof rule.equals === "number" && count !== rule.equals) {
      failures.push(`${labelPrefix} expected ${rule.equals} occurrence(s) of "${text}" but found ${count}`);
    }
    if (typeof rule.min === "number" && count < rule.min) {
      failures.push(`${labelPrefix} expected at least ${rule.min} occurrence(s) of "${text}" but found ${count}`);
    }
    if (typeof rule.max === "number" && count > rule.max) {
      failures.push(`${labelPrefix} expected at most ${rule.max} occurrence(s) of "${text}" but found ${count}`);
    }
  }
  for (const scope of entry.scopes || []) {
    const scopedSource = extractScope(source, scope.start, scope.end);
    const scopeLabel = `${labelPrefix} scope ${scope.start}`;
    if (scopedSource === null) {
      failures.push(`${scopeLabel} was not found`);
      continue;
    }
    for (const expected of scope.mustContain || []) {
      if (!scopedSource.includes(expected)) failures.push(`${scopeLabel} is missing required string: ${expected}`);
    }
    for (const banned of scope.mustNotContain || []) {
      if (scopedSource.includes(banned)) failures.push(`${scopeLabel} contains banned string: ${banned}`);
    }
    for (const rule of scope.occurrences || []) {
      const text = rule.text || "";
      const count = countOccurrences(scopedSource, text);
      if (typeof rule.equals === "number" && count !== rule.equals) {
        failures.push(`${scopeLabel} expected ${rule.equals} occurrence(s) of "${text}" but found ${count}`);
      }
      if (typeof rule.min === "number" && count < rule.min) {
        failures.push(`${scopeLabel} expected at least ${rule.min} occurrence(s) of "${text}" but found ${count}`);
      }
      if (typeof rule.max === "number" && count > rule.max) {
        failures.push(`${scopeLabel} expected at most ${rule.max} occurrence(s) of "${text}" but found ${count}`);
      }
    }
  }
}

for (const entry of contract.files || []) {
  verifySourceExpectations(entry);
}

for (const pair of contract.routeUiPairs || []) {
  const label = pair.label || "unnamed route/UI pair";
  const routeSource = readSource(pair.route?.path || "");
  const uiSource = readSource(pair.ui?.path || "");
  if (!routeSource || !uiSource) continue;

  for (const expectedRoute of pair.route?.mustContain || []) {
    if (!routeSource.includes(expectedRoute)) {
      failures.push(`${label} route source ${pair.route.path} is missing: ${expectedRoute}`);
    }
  }
  for (const expectedUi of pair.ui?.mustContain || []) {
    if (!uiSource.includes(expectedUi)) {
      failures.push(`${label} UI source ${pair.ui.path} is missing: ${expectedUi}`);
    }
  }
  for (const bannedUi of pair.ui?.mustNotContain || []) {
    if (uiSource.includes(bannedUi)) {
      failures.push(`${label} UI source ${pair.ui.path} contains banned string: ${bannedUi}`);
    }
  }
}

for (const proof of contract.navigationProofs || []) {
  const label = proof.label || "unnamed navigation proof";
  for (const source of proof.sources || []) {
    verifySourceExpectations(source, `${label} ${source.path}`);
  }
}

if (failures.length) {
  console.error("UI action contract verification failed:");
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(
  `UI action contract verification passed for ${(contract.files || []).length} files, ${(contract.routeUiPairs || []).length} route/UI pairs, and ${(contract.navigationProofs || []).length} navigation proofs.`,
);
