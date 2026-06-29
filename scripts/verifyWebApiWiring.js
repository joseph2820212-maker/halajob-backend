// check:web-routes - verifies every backend API endpoint the WEBSITE calls
// actually exists in the backend route inventory (i.e. the web/backend wiring).
//
// It scans web/src for paths passed to the axios `api` client (those starting
// with a known API version prefix), normalizes path params, and matches each
// against docs/api/HALAJOB_ROUTE_INVENTORY.json (regenerate with
// `npm run docs:route-report` first so the inventory is current).
//
// Direct axios calls are method-checked. Other API-looking strings stay
// path-only so helper wrappers such as formPost(url) are still covered.
//
// Exit non-zero if any web call has no matching backend route/method.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const WEB_SRC = path.join(ROOT, "web", "src");
const INVENTORY = path.join(ROOT, "docs", "api", "HALAJOB_ROUTE_INVENTORY.json");

const API_PREFIXES = ["user", "company", "employee", "dash", "public", "ai", "analytics"];
const prefixRe = new RegExp(`^/(${API_PREFIXES.join("|")})/v1(/|$)`);

// Collect all .ts/.tsx files under web/src.
const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return /\.(ts|tsx)$/.test(entry.name) ? [full] : [];
  });

// Normalize a path: drop query/trailing slash, turn ${...} and :param into ":p".
const normalize = (value) =>
  value
    .replace(/\?.*$/, "")
    .replace(/\/$/, "")
    .split("/")
    .map((segment) => (segment.includes("${") || segment.startsWith(":") ? ":p" : segment))
    .join("/");

const addCall = (calls, method, raw) => {
  if (!prefixRe.test(raw)) return;
  calls.set(`${method} ${raw}`, { method, raw });
};

const extractCalls = (src) => {
  const found = new Map();
  const directRe = /\bapi\.(get|post|put|patch|delete)(?:<[^(\n]+>)?\(\s*(["'`])(\/[^"'`]+)\2/g;
  let match;
  while ((match = directRe.exec(src))) {
    addCall(found, match[1].toUpperCase(), match[3]);
  }

  const literalRe = /["'`](\/[^"'`]+)["'`]/g;
  while ((match = literalRe.exec(src))) {
    const raw = match[1];
    const alreadyMethodChecked = [...found.values()].some((call) => call.raw === raw);
    if (!alreadyMethodChecked) addCall(found, "ANY", raw);
  }
  return found.values();
};

const webCalls = new Map();
for (const file of walk(WEB_SRC)) {
  const src = fs.readFileSync(file, "utf8");
  for (const call of extractCalls(src)) {
    webCalls.set(`${call.method} ${call.raw}`, call);
  }
}

const inventory = JSON.parse(fs.readFileSync(INVENTORY, "utf8"));
const backend = inventory.records
  .filter((record) => record.method !== "OPTIONS" && record.path && record.path !== "*")
  .map((record) => ({ method: record.method, norm: normalize(record.path), raw: record.path }));

// Segment-aware match: same length; backend param matches anything,
// otherwise literals must be equal (a web param never matches a backend literal).
const segMatch = (webSegments, backendSegments) => {
  if (webSegments.length !== backendSegments.length) return false;
  for (let index = 0; index < webSegments.length; index += 1) {
    const backendSegment = backendSegments[index];
    const webSegment = webSegments[index];
    if (backendSegment === ":p") continue;
    if (webSegment === ":p" || webSegment !== backendSegment) return false;
  }
  return true;
};

const matched = [];
const unmatched = [];
for (const call of [...webCalls.values()].sort((a, b) => `${a.method} ${a.raw}`.localeCompare(`${b.method} ${b.raw}`))) {
  const webSegments = normalize(call.raw).split("/");
  const hit = backend.find(
    (route) => (call.method === "ANY" || route.method === call.method) && segMatch(webSegments, route.norm.split("/")),
  );
  if (hit) matched.push({ call, hit });
  else unmatched.push(call);
}

console.log(`Web API calls discovered: ${webCalls.size}`);
console.log(`  matched to a backend route/method:  ${matched.length}`);
console.log(`  NOT matched (broken wiring):        ${unmatched.length}`);

if (unmatched.length) {
  console.error("\nWeb calls with NO matching backend route/method:");
  for (const call of unmatched) console.error(`  - ${call.method} ${call.raw}`);
  process.exit(1);
}

console.log("\nEvery website API call maps to an existing backend route/method.");
