// check:web-routes — verifies every backend API endpoint the WEBSITE calls
// actually exists in the backend route inventory (i.e. the web ↔ backend wiring).
//
// It scans web/src for paths passed to the axios `api` client (those starting
// with a known API version prefix), normalizes path params, and matches each
// against docs/api/HALAJOB_ROUTE_INVENTORY.json (regenerate with
// `npm run docs:route-report` first so the inventory is current).
//
// Exit non-zero if any web call has no matching backend route.
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
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return walk(full);
    return /\.(ts|tsx)$/.test(e.name) ? [full] : [];
  });

// Normalize a path: drop query/trailing slash, turn ${...} and :param into ":p".
const normalize = (p) =>
  p
    .replace(/\?.*$/, "")
    .replace(/\/$/, "")
    .split("/")
    .map((seg) => (seg.includes("${") || seg.startsWith(":") ? ":p" : seg))
    .join("/");

// Extract candidate API paths from a file's source.
const extractPaths = (src) => {
  const found = new Set();
  // string and template literals beginning with "/"
  const re = /["'`](\/[A-Za-z0-9_./:${}-]+)["'`]/g;
  let m;
  while ((m = re.exec(src))) {
    const raw = m[1];
    if (prefixRe.test(raw)) found.add(raw);
  }
  return found;
};

const webPaths = new Set();
for (const file of walk(WEB_SRC)) {
  const src = fs.readFileSync(file, "utf8");
  for (const p of extractPaths(src)) webPaths.add(p);
}

const inventory = JSON.parse(fs.readFileSync(INVENTORY, "utf8"));
const backend = inventory.records
  .filter((r) => r.method !== "OPTIONS" && r.path && r.path !== "*")
  .map((r) => ({ method: r.method, norm: normalize(r.path), raw: r.path }));

// Segment-aware match: same length; backend param matches anything,
// otherwise literals must be equal (a web param never matches a backend literal).
const segMatch = (wSegs, bSegs) => {
  if (wSegs.length !== bSegs.length) return false;
  for (let i = 0; i < wSegs.length; i++) {
    const b = bSegs[i];
    const w = wSegs[i];
    if (b === ":p") continue;
    if (w === ":p" || w !== b) return false;
  }
  return true;
};

const matched = [];
const unmatched = [];
for (const wp of [...webPaths].sort()) {
  const wSegs = normalize(wp).split("/");
  const hit = backend.find((b) => segMatch(wSegs, b.norm.split("/")));
  if (hit) matched.push({ wp, hit });
  else unmatched.push(wp);
}

console.log(`Web API calls discovered: ${webPaths.size}`);
console.log(`  matched to a backend route:   ${matched.length}`);
console.log(`  NOT matched (broken wiring):  ${unmatched.length}`);

if (unmatched.length) {
  console.error("\n✗ Web calls with NO matching backend route:");
  for (const u of unmatched) console.error(`  - ${u}`);
  process.exit(1);
}

console.log("\n✓ Every website API call maps to an existing backend route.");
