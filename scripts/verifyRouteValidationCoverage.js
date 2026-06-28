import fs from "node:fs";
import path from "node:path";
import listEndpoints from "express-list-endpoints";
import app from "../app.js";

const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const VALIDATOR_NAMES = new Set(["validateRequest", "validate"]);
const enforceAll = process.argv.includes("--enforce");
const writeReport = process.argv.includes("--write-report") || !enforceAll;

const CORE_AUTH_ACCOUNT_WRITES = new Set([
  "POST /user/v1/auth/register",
  "POST /user/v1/auth/campus/register",
  "POST /user/v1/auth/campus/university-login",
  "POST /user/v1/auth/login",
  "POST /user/v1/auth/logout",
  "POST /user/v1/auth/logout-all",
  "POST /user/v1/auth/refresh-token",
  "POST /user/v1/auth/passcode-verify",
  "POST /user/v1/auth/passcode-forgot-password",
  "POST /user/v1/auth/resend-otp",
  "POST /user/v1/auth/forgot-password",
  "POST /user/v1/auth/resetPassword",
  "POST /user/v1/auth/update-image",
  "POST /user/v1/auth/update-profile",
  "POST /user/v1/me/active-context",
  "POST /user/v1/account/delete-request",
  "POST /user/v1/account/delete-request/cancel",
]);

const isPublicOrSystemEndpoint = ({ method, path: routePath }) => {
  if (method === "OPTIONS" || routePath === "*") return true;
  if (routePath === "/health" || routePath.startsWith("/health/")) return true;
  if (routePath.startsWith("/cv/generated/")) return true;
  if (routePath.startsWith("/uploads/")) return true;
  return false;
};

const moduleForPath = (routePath) => {
  if (routePath.startsWith("/dash/v1")) return "admin";
  if (routePath.startsWith("/company/v1")) return "company";
  if (routePath.startsWith("/employee/v1")) return "seeker";
  if (routePath.startsWith("/user/v1/auth")) return "auth";
  if (routePath.startsWith("/user/v1/me") || routePath.startsWith("/user/v1/account")) return "account";
  if (routePath.startsWith("/user/v1/campus") || routePath.startsWith("/campus/v1")) return "campus";
  if (routePath.startsWith("/university/v1")) return "university";
  if (routePath.startsWith("/ai/v1")) return "ai";
  if (routePath.startsWith("/analytics/v1")) return "analytics";
  if (routePath.startsWith("/notifications/v1")) return "notifications";
  if (routePath.startsWith("/trust/v1")) return "trust";
  if (routePath.startsWith("/jobs/v1")) return "jobs";
  if (routePath.startsWith("/user/v1")) return "legacy-user";
  return "other";
};

const records = [];
for (const endpoint of listEndpoints(app)) {
  for (const method of endpoint.methods || []) {
    const middlewares = [...new Set((endpoint.middlewares || []).map(String))];
    const key = `${method} ${endpoint.path}`;
    const isWrite = WRITE_METHODS.has(method);
    const hasValidator = middlewares.some((name) => VALIDATOR_NAMES.has(name));
    records.push({
      key,
      method,
      path: endpoint.path,
      module: moduleForPath(endpoint.path),
      middlewares,
      isWrite,
      hasValidator,
      publicOrSystem: isPublicOrSystemEndpoint({ method, path: endpoint.path }),
    });
  }
}

records.sort((a, b) => a.module.localeCompare(b.module) || a.path.localeCompare(b.path) || a.method.localeCompare(b.method));

const publicOrSystem = records.filter((record) => record.publicOrSystem);
const readOnlyAllowedWithoutBodyValidator = records.filter(
  (record) => !record.isWrite && !record.publicOrSystem && !record.hasValidator
);
const writeEndpoints = records.filter((record) => record.isWrite && !record.publicOrSystem);
const writeWithValidator = writeEndpoints.filter((record) => record.hasValidator);
const writeMissingValidator = writeEndpoints.filter((record) => !record.hasValidator);
const coreAuthAccountMissing = writeEndpoints.filter(
  (record) => CORE_AUTH_ACCOUNT_WRITES.has(record.key) && !record.hasValidator
);

const byModule = new Map();
for (const record of records) {
  const summary = byModule.get(record.module) || {
    module: record.module,
    total: 0,
    writes: 0,
    writesWithValidator: 0,
    writesMissingValidator: 0,
  };
  summary.total += 1;
  if (record.isWrite && !record.publicOrSystem) {
    summary.writes += 1;
    if (record.hasValidator) summary.writesWithValidator += 1;
    else summary.writesMissingValidator += 1;
  }
  byModule.set(record.module, summary);
}

const coveragePercent = writeEndpoints.length
  ? Math.round((writeWithValidator.length / writeEndpoints.length) * 1000) / 10
  : 100;

const report = {
  generatedAt: new Date().toISOString(),
  totals: {
    totalEndpoints: records.length,
    publicSystemEndpoints: publicOrSystem.length,
    readOnlyEndpointsAllowedWithoutBodyValidator: readOnlyAllowedWithoutBodyValidator.length,
    writeUpdateDeleteEndpoints: writeEndpoints.length,
    writeUpdateDeleteEndpointsWithValidator: writeWithValidator.length,
    writeUpdateDeleteEndpointsMissingValidator: writeMissingValidator.length,
    writeValidationCoveragePercent: coveragePercent,
    coreAuthAccountMissingValidators: coreAuthAccountMissing.length,
  },
  modules: [...byModule.values()].sort((a, b) => a.module.localeCompare(b.module)),
  coreAuthAccountMissing: coreAuthAccountMissing.map((record) => ({
    method: record.method,
    path: record.path,
    middlewares: record.middlewares,
  })),
  writeMissingValidator: writeMissingValidator.map((record) => ({
    method: record.method,
    path: record.path,
    module: record.module,
    middlewares: record.middlewares,
  })),
};

const table = (headers, rows) => [
  `| ${headers.join(" | ")} |`,
  `| ${headers.map(() => "---").join(" | ")} |`,
  ...rows.map((row) => `| ${row.map((cell) => String(cell ?? "").replace(/\|/g, "\\|")).join(" | ")} |`),
].join("\n");

const moduleRows = report.modules.map((item) => [
  item.module,
  item.total,
  item.writes,
  item.writesWithValidator,
  item.writesMissingValidator,
]);

const missingRows = report.writeMissingValidator.slice(0, 150).map((record) => [
  record.method,
  record.path,
  record.module,
  record.middlewares.join(", "),
]);

const markdown = `# Route Validation Coverage

Generated: ${report.generatedAt}

## Summary

| Metric | Count |
|---|---:|
| Total endpoints | ${report.totals.totalEndpoints} |
| Public/system endpoints | ${report.totals.publicSystemEndpoints} |
| Read-only endpoints allowed without body validator | ${report.totals.readOnlyEndpointsAllowedWithoutBodyValidator} |
| Write/update/delete endpoints | ${report.totals.writeUpdateDeleteEndpoints} |
| Write/update/delete endpoints with validator | ${report.totals.writeUpdateDeleteEndpointsWithValidator} |
| Write/update/delete endpoints missing validator | ${report.totals.writeUpdateDeleteEndpointsMissingValidator} |
| Write validation coverage | ${report.totals.writeValidationCoveragePercent}% |
| Core auth/account missing validators | ${report.totals.coreAuthAccountMissingValidators} |

## Module Summary

${table(["Module", "Total", "Writes", "Writes With Validator", "Writes Missing Validator"], moduleRows)}

## Missing Write Validators

${missingRows.length ? table(["Method", "Path", "Module", "Middlewares"], missingRows) : "No missing write validators."}
`;

if (writeReport) {
  const docsDir = path.join(process.cwd(), "docs", "api");
  fs.mkdirSync(docsDir, { recursive: true });

  const jsonPath = path.join(docsDir, "ROUTE_VALIDATION_COVERAGE.json");
  const mdPath = path.join(docsDir, "ROUTE_VALIDATION_COVERAGE.md");

  fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(mdPath, markdown);

  console.log("Route validation coverage report generated.");
  console.log(`JSON: ${jsonPath}`);
  console.log(`Markdown: ${mdPath}`);
} else {
  console.log("Route validation coverage report not written in enforce mode.");
}

console.log(`Total endpoints: ${report.totals.totalEndpoints}`);
console.log(`Public/system endpoints: ${report.totals.publicSystemEndpoints}`);
console.log(
  `Read-only endpoints allowed without body validator: ${report.totals.readOnlyEndpointsAllowedWithoutBodyValidator}`
);
console.log(`Write/update/delete endpoints: ${report.totals.writeUpdateDeleteEndpoints}`);
console.log(`Write/update/delete endpoints with validator: ${report.totals.writeUpdateDeleteEndpointsWithValidator}`);
console.log(`Write/update/delete endpoints missing validator: ${report.totals.writeUpdateDeleteEndpointsMissingValidator}`);
console.log(`Write validation coverage: ${report.totals.writeValidationCoveragePercent}%`);
console.log(`Core auth/account missing validators: ${report.totals.coreAuthAccountMissingValidators}`);

if (coreAuthAccountMissing.length) {
  console.error("Core auth/account write routes are missing route-level validators:");
  for (const record of coreAuthAccountMissing) console.error(`- ${record.key}`);
  process.exit(1);
}

if (enforceAll && writeMissingValidator.length) {
  console.error("Write/update/delete route validation coverage is incomplete.");
  process.exit(1);
}
