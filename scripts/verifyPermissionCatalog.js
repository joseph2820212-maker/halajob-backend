// Permission-catalog guard.
//
// Every permission string referenced by a route guard (can('x.y') /
// checkPermission('x.y')) must exist in constants/permissions.js. If it doesn't,
// the permission can never be seeded or granted to a delegated admin role, so
// that admin hits 403 even though the route and UI exist. This guard fails CI
// when a route references a permission that isn't in the catalog.
//
// Note: checkResourcePermission(action) builds `${resource}.${action}` at
// runtime from the route param, so those are intentionally not checked here.

import { readdirSync, readFileSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { ALL_DASH_PERMISSIONS } from '../constants/permissions.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const ROUTE_DIRS = [
  'routes', 'routesUser', 'routesCompany', 'routesUniversity', 'routesTrust',
  'routesAi', 'routesAnalytics', 'routesCampus', 'routesEmployee', 'routesJobs',
  'routesNotifications', 'routesPublic', 'routesHealth',
];

const PERMISSION_RE = /^[a-z_]+\.[a-z_]+$/;
// Matches can( ... ) and checkPermission( ... ); captures the argument list so we
// can pull both single strings and arrays of strings.
const CALL_RE = /(?:\bcan|\bcheckPermission)\s*\(\s*([^)]*?)\)/g;
const STRING_RE = /['"]([a-z_]+\.[a-z_]+)['"]/g;

const defined = new Set(ALL_DASH_PERMISSIONS);
const used = new Map(); // permission -> [file...]

function walk(dir) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const name of entries) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full);
    else if (name.endsWith('.js')) scan(full);
  }
}

function scan(file) {
  const src = readFileSync(file, 'utf8');
  let call;
  while ((call = CALL_RE.exec(src)) !== null) {
    const args = call[1];
    let s;
    while ((s = STRING_RE.exec(args)) !== null) {
      const perm = s[1];
      if (!PERMISSION_RE.test(perm)) continue;
      if (!used.has(perm)) used.set(perm, []);
      used.get(perm).push(file.replace(`${ROOT}/`, ''));
    }
  }
}

for (const d of ROUTE_DIRS) walk(join(ROOT, d));

const missing = [...used.keys()].filter((p) => !defined.has(p)).sort();

if (missing.length) {
  console.error('Permission catalog guard FAILED — these permissions are used by routes but missing from constants/permissions.js:');
  for (const p of missing) {
    console.error(`  ${p}  (e.g. ${used.get(p)[0]})`);
  }
  console.error('\nAdd them to PERMISSIONS so they seed + grant to admin roles.');
  process.exit(1);
}

console.log(`Permission catalog guard OK — ${used.size} route permissions all present in the catalog.`);
