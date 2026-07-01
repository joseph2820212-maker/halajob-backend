import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { existsRepoPath, readRepoFile } from "./utils/repoPaths.js";

const root = process.cwd();
const manifestPath = path.join(
  root,
  "docs/testing/mobile-backend-route-owners.json",
);
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

function isRouteLiteral(value) {
  return (
    value.includes("/v1/") ||
    value.startsWith("/notifications/") ||
    value.startsWith("/analytics/") ||
    value.startsWith("/ai/") ||
    value.startsWith("/jobs/")
  );
}

function extractRouteLiterals(relativePath) {
  const source = readSource(relativePath);
  const routes = [];
  const literalRegex = /(?:'|")((?:\/|\$\{[^}]+\}\/)[^'"]+)(?:'|")/g;
  let match;
  while ((match = literalRegex.exec(source))) {
    const route = match[1].trim();
    if (!route || !isRouteLiteral(route)) continue;
    routes.push({ file: relativePath, route });
  }
  return routes;
}

function requireContains(source, needle, label) {
  if (!source.includes(needle)) failures.push(`${label} missing: ${needle}`);
}

assert.equal(manifest.version, 1, "mobile backend route owner manifest version");
assert.ok(
  Array.isArray(manifest.routeSources) && manifest.routeSources.length > 0,
  "routeSources must be a non-empty array",
);
assert.ok(
  Array.isArray(manifest.owners) && manifest.owners.length > 0,
  "owners must be a non-empty array",
);

const owners = manifest.owners.map((owner) => {
  assert.ok(owner.id, "route owner missing id");
  assert.ok(
    Array.isArray(owner.routePatterns) && owner.routePatterns.length > 0,
    `route owner ${owner.id} missing routePatterns`,
  );
  return {
    ...owner,
    regexes: owner.routePatterns.map((pattern) => new RegExp(pattern)),
    matchedRoutes: [],
  };
});

for (const owner of owners) {
  for (const proof of owner.proof || []) {
    const source = readSource(proof.path);
    for (const expected of proof.mustContain || []) {
      requireContains(source, expected, `owner ${owner.id} proof ${proof.path}`);
    }
  }
}

const routeEntries = manifest.routeSources.flatMap(extractRouteLiterals);
const uniqueRouteEntries = [
  ...new Map(
    routeEntries.map((entry) => [`${entry.file}\u0000${entry.route}`, entry]),
  ).values(),
].sort((a, b) =>
  `${a.file} ${a.route}`.localeCompare(`${b.file} ${b.route}`),
);

for (const entry of uniqueRouteEntries) {
  const matches = owners.filter((owner) =>
    owner.regexes.some((regex) => regex.test(entry.route)),
  );
  if (!matches.length) {
    failures.push(`${entry.file} has unowned mobile backend route: ${entry.route}`);
    continue;
  }
  for (const owner of matches) owner.matchedRoutes.push(entry);
}

for (const owner of owners) {
  if (!owner.matchedRoutes.length) {
    failures.push(`route owner ${owner.id} did not match any mobile routes`);
  }
}

if (failures.length) {
  console.error("Mobile backend route owner verification failed:");
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

const ownerRows = owners
  .map((owner) => `${owner.id}:${owner.matchedRoutes.length}`)
  .join(", ");

console.log(
  `Mobile backend route owners verified for ${uniqueRouteEntries.length} route literals across ${owners.length} owners (${ownerRows}).`,
);
