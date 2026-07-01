import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const ownerManifestPath = path.join(
  root,
  "docs/testing/mobile-backend-route-owners.json",
);
const journeyManifestPath = path.join(
  root,
  "docs/testing/mobile-backend-route-ui-journeys.json",
);
const ownersManifest = JSON.parse(fs.readFileSync(ownerManifestPath, "utf8"));
const journeysManifest = JSON.parse(fs.readFileSync(journeyManifestPath, "utf8"));
const sourceCache = new Map();
const failures = [];

const allowedModes = new Set(["auth", "background", "ui"]);

function readSource(relativePath) {
  const fullPath = path.join(root, relativePath);
  if (!fs.existsSync(fullPath)) {
    failures.push(`${relativePath} does not exist`);
    return "";
  }
  if (!sourceCache.has(relativePath)) {
    sourceCache.set(relativePath, fs.readFileSync(fullPath, "utf8"));
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

function verifyProofList(proofs, label) {
  if (!Array.isArray(proofs) || proofs.length === 0) {
    failures.push(`${label} must be a non-empty proof list`);
    return;
  }
  for (const proof of proofs) {
    const proofLabel = `${label} ${proof.path || "unknown path"}`;
    if (!proof.path) {
      failures.push(`${label} has a proof without path`);
      continue;
    }
    const source = readSource(proof.path);
    for (const expected of proof.mustContain || []) {
      requireContains(source, expected, proofLabel);
    }
  }
}

assert.equal(ownersManifest.version, 1, "mobile backend owner manifest version");
assert.equal(journeysManifest.version, 1, "mobile route UI journey manifest version");
assert.ok(
  Array.isArray(ownersManifest.owners) && ownersManifest.owners.length > 0,
  "owner manifest owners must be non-empty",
);
assert.ok(
  Array.isArray(journeysManifest.journeys) && journeysManifest.journeys.length > 0,
  "journey manifest journeys must be non-empty",
);

const ownerMap = new Map();
for (const owner of ownersManifest.owners) {
  if (ownerMap.has(owner.id)) failures.push(`duplicate route owner id: ${owner.id}`);
  ownerMap.set(owner.id, {
    ...owner,
    regexes: (owner.routePatterns || []).map((pattern) => new RegExp(pattern)),
    matchedRoutes: [],
  });
}

const routeEntries = (ownersManifest.routeSources || []).flatMap(extractRouteLiterals);
const uniqueRouteEntries = [
  ...new Map(
    routeEntries.map((entry) => [`${entry.file}\u0000${entry.route}`, entry]),
  ).values(),
];

for (const entry of uniqueRouteEntries) {
  for (const owner of ownerMap.values()) {
    if (owner.regexes.some((regex) => regex.test(entry.route))) {
      owner.matchedRoutes.push(entry);
    }
  }
}

const journeyMap = new Map();
for (const journey of journeysManifest.journeys) {
  const ownerId = journey.ownerId;
  if (!ownerId) {
    failures.push("journey missing ownerId");
    continue;
  }
  if (journeyMap.has(ownerId)) failures.push(`duplicate journey ownerId: ${ownerId}`);
  journeyMap.set(ownerId, journey);

  const owner = ownerMap.get(ownerId);
  if (!owner) {
    failures.push(`journey references unknown owner: ${ownerId}`);
    continue;
  }
  if (!allowedModes.has(journey.mode)) {
    failures.push(`journey ${ownerId} has unsupported mode: ${journey.mode}`);
  }
  if (!owner.matchedRoutes.length) {
    failures.push(`journey ${ownerId} has no matched mobile backend routes`);
  }
  if (owner.kind === "background" && journey.mode !== "background") {
    failures.push(`background owner ${ownerId} must use background mode`);
  }
  if (owner.kind === "auth" && journey.mode !== "auth") {
    failures.push(`auth owner ${ownerId} must use auth mode`);
  }
  if ((owner.kind === "role_ui" || owner.kind === "shared_ui") && journey.mode !== "ui") {
    failures.push(`UI owner ${ownerId} must use ui mode`);
  }

  if (journey.mode === "background") {
    verifyProofList(journey.backgroundProof, `journey ${ownerId} backgroundProof`);
  } else {
    verifyProofList(journey.entryProof, `journey ${ownerId} entryProof`);
    verifyProofList(journey.destinationProof, `journey ${ownerId} destinationProof`);
  }
}

for (const ownerId of ownerMap.keys()) {
  if (!journeyMap.has(ownerId)) {
    failures.push(`route owner ${ownerId} is missing a UI/background journey`);
  }
}

if (failures.length) {
  console.error("Mobile backend route UI journey verification failed:");
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

const modeRows = [...journeyMap.values()].reduce((counts, journey) => {
  counts[journey.mode] = (counts[journey.mode] || 0) + 1;
  return counts;
}, {});

console.log(
  `Mobile backend route UI journeys verified for ${journeyMap.size} owners ` +
    `(${Object.entries(modeRows)
      .map(([mode, count]) => `${mode}:${count}`)
      .join(", ")}).`,
);
