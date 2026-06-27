import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";
import "../models/index.js";

const outputPath = path.join(process.cwd(), "docs", "DATABASE_MODELS.md");

const mdCell = (value) => String(value ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");

const table = (headers, rows) => [
  `| ${headers.join(" | ")} |`,
  `| ${headers.map(() => "---").join(" | ")} |`,
  ...rows.map((row) => `| ${row.map(mdCell).join(" | ")} |`),
].join("\n");

const describeDefault = (value) => {
  if (value === undefined) return "";
  if (typeof value === "function") return value.name || "function";
  if (value === null) return "null";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

const describeType = (schemaType) => {
  if (!schemaType) return "";
  if (schemaType.instance === "Array") {
    const caster = schemaType.caster || schemaType.$embeddedSchemaType;
    return caster ? `Array<${caster.instance || caster.constructor?.name || "Mixed"}>` : "Array";
  }
  return schemaType.instance || schemaType.constructor?.name || "";
};

const describeEnum = (schemaType) => {
  const values = schemaType?.enumValues || schemaType?.caster?.enumValues || [];
  return values.length ? values.join(", ") : "";
};

const describeRef = (schemaType) => schemaType?.options?.ref || schemaType?.caster?.options?.ref || "";

const describeIndex = (index) => {
  const [fields, options] = index;
  const optionParts = Object.entries(options || {})
    .filter(([, value]) => value !== undefined && value !== false)
    .map(([key, value]) => `${key}=${JSON.stringify(value)}`);
  return `\`${JSON.stringify(fields)}\`${optionParts.length ? ` (${optionParts.join(", ")})` : ""}`;
};

const modelNames = mongoose.modelNames().sort((a, b) => a.localeCompare(b));
const now = new Date().toISOString();

const sections = modelNames.map((modelName) => {
  const model = mongoose.model(modelName);
  const schema = model.schema;
  const fieldRows = Object.entries(schema.paths)
    .filter(([field]) => !field.startsWith("__"))
    .map(([field, schemaType]) => [
      `\`${field}\``,
      describeType(schemaType),
      schemaType.isRequired === true ? "yes" : "",
      describeDefault(schemaType.defaultValue),
      describeEnum(schemaType),
      describeRef(schemaType),
    ]);

  const indexRows = schema.indexes().map((index) => [describeIndex(index)]);

  return `## ${modelName}

| Item | Value |
|---|---|
| Collection | \`${model.collection.name}\` |
| Timestamps | ${schema.options.timestamps ? "yes" : "no"} |

### Fields

${table(["Field", "Type", "Required", "Default", "Enum", "Ref"], fieldRows)}

### Indexes

${indexRows.length ? table(["Index"], indexRows) : "No explicit schema indexes."}
`;
});

const doc = `# Database Models

Generated: ${now}
Source: live Mongoose schemas loaded from \`models/index.js\`.

This is a generated schema inventory. It documents collections, fields, required/default/enum/ref metadata, and declared indexes. Business meaning, migration history, and data-retention rules still need owner/developer review.

## Summary

${table(
  ["Model", "Collection", "Fields", "Indexes"],
  modelNames.map((modelName) => {
    const model = mongoose.model(modelName);
    return [
      modelName,
      `\`${model.collection.name}\``,
      Object.keys(model.schema.paths).length,
      model.schema.indexes().length,
    ];
  })
)}

${sections.join("\n")}
`;

fs.writeFileSync(outputPath, doc);
console.log(`Database model docs written to ${path.relative(process.cwd(), outputPath)} (${modelNames.length} models).`);
