import fs from "node:fs";
import path from "node:path";
import listEndpoints from "express-list-endpoints";
import app from "../app.js";

const docsApiDir = path.join(process.cwd(), "docs", "api");
const reportPath = path.join(docsApiDir, "ROUTE_VERIFICATION_REPORT.md");
const inventoryPath = path.join(docsApiDir, "HALAJOB_ROUTE_INVENTORY.json");

const AUTH_GUARD_NAMES = new Set([
  "authUser",
  "isAdmin",
  "activeContextGuard",
  "requireCompanyContext",
  "requireAppAccount",
  "requireCampusStudent",
  "requireUniversityAdminContext",
  "requireCompanyPermission",
]);

const normalizeMiddleware = (middlewares = []) => [...new Set(middlewares.map(String).filter(Boolean))];

const moduleForPath = (pathName) => {
  if (pathName === "*" || pathName.startsWith("/health")) return "Health";
  if (pathName.startsWith("/dash/v1") || pathName.startsWith("/admin/v1")) return "Admin";
  if (pathName.startsWith("/company/v1")) return "Company";
  if (pathName.startsWith("/employee/v1")) return "Seeker";
  if (pathName.startsWith("/user/v1/campus")) return "Campus Student";
  if (pathName.startsWith("/campus/v1")) return "Campus";
  if (pathName.startsWith("/university/v1")) return "University";
  if (pathName.startsWith("/ai/v1")) return "AI";
  if (pathName.startsWith("/analytics/v1")) return "Analytics";
  if (pathName.startsWith("/trust/v1")) return "Trust";
  if (pathName.startsWith("/notifications/v1")) return "Notifications";
  if (pathName.startsWith("/jobs/v1")) return "Jobs";
  if (pathName.startsWith("/user/v1")) return "Legacy User";
  if (pathName.startsWith("/cv/generated")) return "Files";
  if (pathName.startsWith("/uploads")) return "Files";
  return "Other";
};

const isKnownPublic = ({ method, path: pathName, middlewares = [] }) => {
  if (method === "OPTIONS" || pathName === "*") return true;
  if (middlewares.includes("optionalAuthUser")) return true;
  if (pathName === "/health") return true;
  if (pathName.startsWith("/cv/generated/")) return true;
  if (pathName.startsWith("/dash/v1/image/")) return true;
  if (pathName === "/dash/v1/auth/refresh") return true;
  if (pathName === "/dash/v1/auth/logout") return true;
  if (pathName === "/company/v1/auth/logout") return true;
  if (pathName === "/user/v1/auth/logout") return true;
  if (pathName === "/user/v1/auth/refresh-token") return true;
  if (pathName === "/user/v1/auth/passcode-verify") return true;
  if (pathName === "/user/v1/auth/resend-otp") return true;
  if (pathName === "/user/v1/auth/campus/register") return true;
  if (pathName === "/user/v1/auth/campus/university-login") return true;
  if (pathName.includes("/auth/login")) return true;
  if (pathName.includes("/auth/register")) return true;
  if (pathName.includes("/auth/forgot-password")) return true;
  if (pathName.includes("/auth/passcode-forgot-password")) return true;
  if (pathName.includes("/auth/resetPassword")) return true;
  if (pathName === "/user/v1/career-passport/share/:token") return true;
  if (pathName === "/user/v1/campus/universities") return true;
  if (pathName === "/user/v1/campus/universities/:id/campuses") return true;
  if (pathName === "/campus/v1/universities") return true;
  if (pathName === "/campus/v1/universities/:id/campuses") return true;
  if (method === "GET" && pathName.startsWith("/user/v1/global/")) return true;
  if (method === "GET" && pathName.startsWith("/user/v1/helper/")) return true;
  if (method === "GET" && pathName.startsWith("/user/v1/page/")) return true;
  if (method === "GET" && pathName.startsWith("/user/v1/banner/")) return true;
  if (method === "GET" && pathName.startsWith("/user/v1/keyword/")) return true;
  if (method === "GET" && pathName === "/user/v1/job-information/list-job-reviews/:id") return true;
  if (pathName.startsWith("/jobs/v1/public")) return true;
  return false;
};

const hasAuthGuard = (middlewares) =>
  middlewares.some((name) => AUTH_GUARD_NAMES.has(name) || name.startsWith("require"));

const inferredGuardsForPath = ({ method, path: pathName }) => {
  if (method === "OPTIONS" || pathName === "*") return [];

  const guards = [];

  if (pathName.startsWith("/dash/v1")) {
    const isPublicDashboardPath =
      pathName === "/dash/v1/auth/login" ||
      pathName === "/dash/v1/auth/refresh" ||
      pathName === "/dash/v1/auth/logout" ||
      pathName.startsWith("/dash/v1/image/");
    if (!isPublicDashboardPath) guards.push("inferred:isAdmin");
  }

  if (pathName.startsWith("/admin/v1/trust")) guards.push("inferred:isAdmin");

  if (
    pathName.startsWith("/company/v1/global") ||
    pathName.startsWith("/company/v1/helper") ||
    pathName.startsWith("/company/v1/jobs") ||
    pathName.startsWith("/company/v1/campus")
  ) {
    guards.push("inferred:approvedCompanyGuard");
  }

  if (
    pathName.startsWith("/employee/v1/global") ||
    pathName.startsWith("/employee/v1/cv") ||
    pathName.startsWith("/employee/v1/helper")
  ) {
    guards.push("inferred:employeeAccountGuard");
  }

  if (pathName.startsWith("/notifications/v1")) guards.push("inferred:authUser");
  if (pathName.startsWith("/analytics/v1")) guards.push("inferred:authUser");
  if (pathName.startsWith("/university/v1")) guards.push("inferred:universityAdminGuard");

  if (
    pathName.startsWith("/campus/v1") &&
    pathName !== "/campus/v1/universities" &&
    pathName !== "/campus/v1/universities/:id/campuses"
  ) {
    guards.push(pathName.includes("/admin/") ? "inferred:universityAdminGuard" : "inferred:authUser");
  }

  return guards;
};

const sortRecord = (a, b) =>
  a.module.localeCompare(b.module) || a.path.localeCompare(b.path) || a.method.localeCompare(b.method);

const rawEndpoints = listEndpoints(app);
const byMethodPath = new Map();

for (const endpoint of rawEndpoints) {
  for (const method of endpoint.methods || []) {
    const key = `${method} ${endpoint.path}`;
    const existing = byMethodPath.get(key);
    const middlewares = normalizeMiddleware([...(existing?.middlewares || []), ...(endpoint.middlewares || [])]);
    byMethodPath.set(key, {
      method,
      path: endpoint.path,
      module: moduleForPath(endpoint.path),
      middlewares,
    });
  }
}

const records = [...byMethodPath.values()]
  .map((record) => {
    const explicitGuard = hasAuthGuard(record.middlewares);
    const inferredGuards = inferredGuardsForPath(record);
    return {
      ...record,
      inferredGuards,
      hasAuthGuard: explicitGuard || inferredGuards.length > 0,
      guardSource: explicitGuard ? "explicit" : inferredGuards.length ? "inferred-parent-mount" : "none",
      knownPublic: isKnownPublic(record),
    };
  })
  .sort(sortRecord);

const modules = new Map();
for (const record of records) {
  const module = modules.get(record.module) || {
    module: record.module,
    total: 0,
    protected: 0,
    knownPublic: 0,
    unclassifiedUnguarded: 0,
  };
  module.total += 1;
  if (record.hasAuthGuard) module.protected += 1;
  else if (record.knownPublic) module.knownPublic += 1;
  else module.unclassifiedUnguarded += 1;
  modules.set(record.module, module);
}

const unclassifiedUnguarded = records.filter((record) => !record.hasAuthGuard && !record.knownPublic);
const middlewareNames = [...new Set(records.flatMap((record) => record.middlewares))].sort();
const inferredGuardNames = [...new Set(records.flatMap((record) => record.inferredGuards))].sort();

const table = (headers, rows) => {
  const separator = headers.map(() => "---");
  return [
    `| ${headers.join(" | ")} |`,
    `| ${separator.join(" | ")} |`,
    ...rows.map((row) => `| ${row.join(" | ")} |`),
  ].join("\n");
};

const escapeCell = (value) => String(value ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");

const moduleRows = [...modules.values()]
  .sort((a, b) => a.module.localeCompare(b.module))
  .map((item) => [
    escapeCell(item.module),
    item.total,
    item.protected,
    item.knownPublic,
    item.unclassifiedUnguarded,
  ]);

const unclassifiedRows = unclassifiedUnguarded.slice(0, 100).map((record) => [
  record.method,
  escapeCell(record.path),
  escapeCell(record.module),
  escapeCell(record.middlewares.join(", ")),
]);

const now = new Date().toISOString();
const report = `# Route Verification Report

Generated: ${now}
Source: live Express app via \`express-list-endpoints\`.

## Summary

| Metric | Count |
|---|---:|
| Raw Express endpoint entries | ${rawEndpoints.length} |
| Unique method/path endpoints | ${records.length} |
| Endpoints with detected auth/role guard | ${records.filter((record) => record.hasAuthGuard).length} |
| Known public/system endpoints | ${records.filter((record) => !record.hasAuthGuard && record.knownPublic).length} |
| Unguarded endpoints needing manual classification | ${unclassifiedUnguarded.length} |

Full machine-readable inventory:

\`\`\`text
docs/api/HALAJOB_ROUTE_INVENTORY.json
\`\`\`

## Module Counts

${table(
  ["Module", "Total", "Protected", "Known public", "Needs classification"],
  moduleRows
)}

## Guard Detection

Detected guard middleware names:

\`\`\`text
${[...AUTH_GUARD_NAMES].sort().join("\n")}
\`\`\`

Middleware names observed in the live app:

\`\`\`text
${middlewareNames.join("\n")}
\`\`\`

Parent-mount guards inferred from route index files:

\`\`\`text
${inferredGuardNames.join("\n") || "none"}
\`\`\`

Note: parent-mount guards are inferred because \`express-list-endpoints\` does not consistently attach \`router.use(...)\` middleware names to every nested child route.

## Unguarded Endpoints Needing Manual Classification

These endpoints do not expose one of the known guard middleware names, do not match a known protected parent mount, and are not in the known-public allowlist. Some may be intentionally public or may be protected indirectly by controller code. Review them before launch.

${unclassifiedRows.length ? table(["Method", "Path", "Module", "Middlewares"], unclassifiedRows) : "None found."}

${unclassifiedUnguarded.length > unclassifiedRows.length ? `\nShowing first ${unclassifiedRows.length} of ${unclassifiedUnguarded.length}. See the JSON inventory for the full list.\n` : ""}

## Current Verification Coverage

| Area | Evidence |
|---|---|
| Mobile/campus route mounts | \`npm run test:mobile-routes\` |
| Security HTTP contracts | \`npm run test:security-http\` |
| AI route/safety contracts | \`npm run test:ai-safety\` |
| Launch filters/contracts | \`npm run test:global-launch-contract\` |
| Secret/runtime-file hygiene | \`npm run check:secrets\` |

## Gaps Still To Close

| Gap | Status |
|---|---|
| Full endpoint request/response API reference | Route and auth inventory exists in \`docs/api/HALAJOB_API_REFERENCE.md\`; exact request/response schemas are still not complete. |
| OpenAPI file | Generated skeleton exists at \`docs/api/HALAJOB_OPENAPI.yaml\`; operation paths, methods, tags, auth, and generic responses are present, but exact schemas still need route-by-route expansion. |
| Postman collection | Generated collection exists at \`docs/api/HALAJOB_POSTMAN_COLLECTION.json\` with local/dev environments; endpoint-specific example bodies still need route-by-route expansion. |
| Per-route validator coverage | Not mechanically complete because validators/multer/controller validation are not consistently named. |
| Per-route role matrix | Baseline exists in \`docs/security/ROLE_PERMISSION_MATRIX.md\`; route-by-route expansion still required. |
| Live smoke results | Requires deployed API and approved test accounts. |
`;

fs.mkdirSync(docsApiDir, { recursive: true });
fs.writeFileSync(inventoryPath, `${JSON.stringify({ generatedAt: now, records }, null, 2)}\n`);
fs.writeFileSync(reportPath, report);

console.log(`Route report written to ${path.relative(process.cwd(), reportPath)}`);
console.log(`Route inventory written to ${path.relative(process.cwd(), inventoryPath)} (${records.length} endpoints).`);
