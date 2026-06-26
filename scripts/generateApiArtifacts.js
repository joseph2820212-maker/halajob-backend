import fs from "node:fs";
import path from "node:path";

const docsApiDir = path.join(process.cwd(), "docs", "api");
const inventoryPath = path.join(docsApiDir, "HALAJOB_ROUTE_INVENTORY.json");
const apiReferencePath = path.join(docsApiDir, "HALAJOB_API_REFERENCE.md");
const openApiPath = path.join(docsApiDir, "HALAJOB_OPENAPI.yaml");
const postmanPath = path.join(docsApiDir, "HALAJOB_POSTMAN_COLLECTION.json");
const postmanLocalPath = path.join(docsApiDir, "HALAJOB_POSTMAN_ENV_LOCAL.json");
const postmanDevPath = path.join(docsApiDir, "HALAJOB_POSTMAN_ENV_DEV.json");

if (!fs.existsSync(inventoryPath)) {
  console.error("Route inventory is missing. Run npm run docs:route-report first.");
  process.exit(1);
}

const inventory = JSON.parse(fs.readFileSync(inventoryPath, "utf8"));
const records = inventory.records
  .filter((record) => record.method !== "OPTIONS" && record.path !== "*")
  .sort((a, b) => a.module.localeCompare(b.module) || a.path.localeCompare(b.path) || a.method.localeCompare(b.method));

const modules = [...new Set(records.map((record) => record.module))].sort();

const yamlQuote = (value) => `"${String(value ?? "").replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
const mdCell = (value) => String(value ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
const safeOperationId = (record) =>
  `${record.module}_${record.method}_${record.path}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 120);

const expressToOpenApiPath = (routePath) => routePath.replace(/:([A-Za-z0-9_]+)/g, "{$1}");

const pathParams = (routePath) => {
  const params = [];
  const pattern = /:([A-Za-z0-9_]+)/g;
  let match;
  while ((match = pattern.exec(routePath)) !== null) {
    if (!params.includes(match[1])) params.push(match[1]);
  }
  return params;
};

const table = (headers, rows) => [
  `| ${headers.join(" | ")} |`,
  `| ${headers.map(() => "---").join(" | ")} |`,
  ...rows.map((row) => `| ${row.join(" | ")} |`),
].join("\n");

const now = new Date().toISOString();

const referenceSections = modules.map((module) => {
  const rows = records
    .filter((record) => record.module === module)
    .map((record) => [
      record.method,
      `\`${mdCell(record.path)}\``,
      record.hasAuthGuard ? "Bearer token" : record.knownPublic ? "Public/system" : "Review",
      mdCell(record.guardSource || "none"),
      mdCell([...(record.inferredGuards || []), ...(record.middlewares || [])].join(", ")),
    ]);

  return `## ${module}\n\n${table(["Method", "Path", "Auth", "Guard source", "Middleware/guards"], rows)}\n`;
});

const apiReference = `# HalaJob API Reference

Generated: ${now}
Source: \`docs/api/HALAJOB_ROUTE_INVENTORY.json\`.

This is a route-level API reference skeleton. It documents the live Express route surface, authentication classification, and guard evidence. Detailed request bodies, response examples, validation schemas, audit events, and business rules still need to be filled route-by-route before the backend can be called fully documented.

## Global Conventions

| Item | Current rule |
|---|---|
| Authentication | \`Authorization: Bearer <token>\` for protected routes. |
| Language | Preserve legacy \`lan\`; migrate clients toward \`x-lang: en|ar\`. |
| Content type | JSON by default; multipart for uploads. |
| IDs | MongoDB ObjectId strings unless otherwise documented. |
| Response envelope | Mixed legacy envelopes exist. New routes should standardize message/error keys without breaking old clients. |
| Full inventory | \`docs/api/HALAJOB_ROUTE_INVENTORY.json\` |
| OpenAPI skeleton | \`docs/api/HALAJOB_OPENAPI.yaml\` |
| Postman collection | \`docs/api/HALAJOB_POSTMAN_COLLECTION.json\` |

## Counts

${table(
  ["Module", "Endpoints"],
  modules.map((module) => [module, records.filter((record) => record.module === module).length])
)}

${referenceSections.join("\n")}
`;

const openApiLines = [
  "openapi: 3.0.3",
  "info:",
  "  title: HalaJob API",
  "  version: 1.0.0",
  "  description: Generated route-level OpenAPI skeleton. Add schemas/examples before treating as complete.",
  "servers:",
  "  - url: https://jobzain.com",
  "    description: Production/API base",
  "  - url: http://localhost:3000",
  "    description: Local backend",
  "components:",
  "  securitySchemes:",
  "    bearerAuth:",
  "      type: http",
  "      scheme: bearer",
  "      bearerFormat: JWT",
  "paths:",
];

const byOpenApiPath = new Map();
for (const record of records) {
  const openPath = expressToOpenApiPath(record.path);
  const list = byOpenApiPath.get(openPath) || [];
  list.push(record);
  byOpenApiPath.set(openPath, list);
}

const operationIdCounts = new Map();
const operationIdFor = (record) => {
  const base = safeOperationId(record);
  const count = operationIdCounts.get(base) || 0;
  operationIdCounts.set(base, count + 1);
  return count === 0 ? base : `${base}_${count + 1}`;
};

for (const [openPath, pathRecords] of [...byOpenApiPath.entries()].sort(([a], [b]) => a.localeCompare(b))) {
  openApiLines.push(`  ${yamlQuote(openPath)}:`);
  for (const record of pathRecords.sort((a, b) => a.method.localeCompare(b.method))) {
    openApiLines.push(`    ${record.method.toLowerCase()}:`);
    openApiLines.push(`      tags: [${yamlQuote(record.module)}]`);
    openApiLines.push(`      summary: ${yamlQuote(`${record.method} ${record.path}`)}`);
    openApiLines.push(`      operationId: ${yamlQuote(operationIdFor(record))}`);
    openApiLines.push(`      description: ${yamlQuote("Generated route skeleton. Fill request/response schema and business rules before launch documentation is considered complete.")}`);
    if (record.hasAuthGuard) {
      openApiLines.push("      security:");
      openApiLines.push("        - bearerAuth: []");
    }
    const params = pathParams(record.path);
    if (params.length) {
      openApiLines.push("      parameters:");
      for (const param of params) {
        openApiLines.push(`        - name: ${yamlQuote(param)}`);
        openApiLines.push("          in: path");
        openApiLines.push("          required: true");
        openApiLines.push("          schema:");
        openApiLines.push("            type: string");
      }
    }
    if (["POST", "PUT", "PATCH"].includes(record.method)) {
      openApiLines.push("      requestBody:");
      openApiLines.push("        required: false");
      openApiLines.push("        content:");
      openApiLines.push("          application/json:");
      openApiLines.push("            schema:");
      openApiLines.push("              type: object");
    }
    openApiLines.push("      responses:");
    openApiLines.push("        \"200\":");
    openApiLines.push("          description: Successful response");
    openApiLines.push("        \"400\":");
    openApiLines.push("          description: Validation or request error");
    if (record.hasAuthGuard) {
      openApiLines.push("        \"401\":");
      openApiLines.push("          description: Missing or invalid token");
      openApiLines.push("        \"403\":");
      openApiLines.push("          description: Forbidden");
    }
  }
}

const postmanItems = modules.map((module) => ({
  name: module,
  item: records
    .filter((record) => record.module === module)
    .map((record) => ({
      name: `${record.method} ${record.path}`,
      request: {
        method: record.method,
        header: [
          { key: "Accept", value: "application/json" },
          { key: "lan", value: "{{lang}}" },
          ...(record.hasAuthGuard ? [{ key: "Authorization", value: "Bearer {{token}}" }] : []),
        ],
        url: {
          raw: `{{baseUrl}}${record.path}`,
          host: ["{{baseUrl}}"],
          path: record.path.replace(/^\/+/, "").split("/"),
        },
        description: `Generated from live route inventory. Module: ${record.module}. Guard source: ${record.guardSource}.`,
      },
    })),
}));

const postmanCollection = {
  info: {
    name: "HalaJob API",
    description: "Generated route-level Postman collection. Add request bodies/tests as schemas mature.",
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
  },
  auth: {
    type: "bearer",
    bearer: [{ key: "token", value: "{{token}}", type: "string" }],
  },
  variable: [
    { key: "baseUrl", value: "https://jobzain.com" },
    { key: "token", value: "" },
    { key: "lang", value: "en" },
  ],
  item: postmanItems,
};

const makeEnvironment = ({ name, baseUrl }) => ({
  name,
  values: [
    { key: "baseUrl", value: baseUrl, enabled: true },
    { key: "token", value: "", enabled: true },
    { key: "lang", value: "en", enabled: true },
  ],
  _postman_variable_scope: "environment",
  _postman_exported_at: now,
  _postman_exported_using: "HalaJob generator",
});

fs.writeFileSync(apiReferencePath, apiReference);
fs.writeFileSync(openApiPath, `${openApiLines.join("\n")}\n`);
fs.writeFileSync(postmanPath, `${JSON.stringify(postmanCollection, null, 2)}\n`);
fs.writeFileSync(postmanLocalPath, `${JSON.stringify(makeEnvironment({ name: "HalaJob Local", baseUrl: "http://localhost:3000" }), null, 2)}\n`);
fs.writeFileSync(postmanDevPath, `${JSON.stringify(makeEnvironment({ name: "HalaJob Dev", baseUrl: "https://jobzain.com" }), null, 2)}\n`);

console.log(`API reference written to ${path.relative(process.cwd(), apiReferencePath)}`);
console.log(`OpenAPI skeleton written to ${path.relative(process.cwd(), openApiPath)}`);
console.log(`Postman collection written to ${path.relative(process.cwd(), postmanPath)}`);
