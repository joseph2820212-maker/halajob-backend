import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const checks = [
  {
    file: "helper/ReturnAppData/index.js",
    banned: [
      "updateData = ({ res, data, other = {}, status = 202",
      "deleteData = ({ res, other = {}, status = 203",
    ],
    required: [
      "updateData = ({ res, data, other = {}, status = 200",
      "deleteData = ({ res, other = {}, status = 200",
    ],
  },
  {
    file: "helper/ReturnDashData/index.js",
    banned: [
      "updateData = ({ res, data, other = {}, status = 202",
      "deleteData = ({ res, other = {}, status = 203",
    ],
    required: [
      "updateData = ({ res, data, other = {}, status = 200",
      "deleteData = ({ res, other = {}, status = 200",
    ],
  },
  {
    file: "controllers/dash/adminNotificationController.js",
    banned: ["res.status(202)"],
    required: ["res.status(200)"],
  },
];

const failures = [];

for (const check of checks) {
  const absolutePath = path.join(repoRoot, check.file);
  const source = fs.readFileSync(absolutePath, "utf8");

  for (const text of check.banned) {
    if (source.includes(text)) {
      failures.push(`${check.file} still contains banned response-code contract: ${text}`);
    }
  }

  for (const text of check.required) {
    if (!source.includes(text)) {
      failures.push(`${check.file} is missing required response-code contract: ${text}`);
    }
  }
}

if (failures.length) {
  console.error("[response-code-contract] failed");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("[response-code-contract] ok");
