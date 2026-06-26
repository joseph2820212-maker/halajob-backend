import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const SKIPPED_DIRS = new Set([
  ".git",
  "node_modules",
  "build",
  "dist",
  "coverage",
  ".dart_tool",
  ".flutter-user",
  ".pub-cache",
  "uploads",
  "cv",
  "logs",
  "backups",
]);

const TEXT_EXTENSIONS = new Set([
  "",
  ".arb",
  ".conf",
  ".env",
  ".example",
  ".gradle",
  ".js",
  ".json",
  ".kts",
  ".md",
  ".properties",
  ".ps1",
  ".txt",
  ".xml",
  ".yaml",
  ".yml",
]);

const SECRET_PATTERNS = [
  /-----BEGIN PRIVATE KEY-----/,
  /"private_key_id"\s*:/,
  /"client_email"\s*:/,
  /firebase-adminsdk/i,
  /"type"\s*:\s*"service_account"/,
];

const normalize = (filePath) => path.relative(root, filePath).replace(/\\/g, "/");

const isAllowedReference = (relativePath) =>
  relativePath === ".gitignore" ||
  relativePath === "notification/serviceAccount.example.json" ||
  relativePath === "scripts/verifyNoSecrets.js" ||
  relativePath.startsWith("docs/") ||
  relativePath.startsWith("mobile/docs/");

const shouldScanFile = (filePath) => {
  const stat = fs.statSync(filePath);
  if (!stat.isFile() || stat.size > 5 * 1024 * 1024) return false;

  const base = path.basename(filePath);
  if (base.startsWith(".env")) return true;

  const extension = path.extname(filePath).toLowerCase();
  return TEXT_EXTENSIONS.has(extension);
};

const walk = (dir, files = []) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIPPED_DIRS.has(entry.name)) continue;
      walk(path.join(dir, entry.name), files);
      continue;
    }

    const filePath = path.join(dir, entry.name);
    if (shouldScanFile(filePath)) files.push(filePath);
  }
  return files;
};

const matches = [];
const allowedMatches = [];

for (const filePath of walk(root)) {
  const relativePath = normalize(filePath);
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/);

  lines.forEach((line, index) => {
    if (!SECRET_PATTERNS.some((pattern) => pattern.test(line))) return;

    const item = `${relativePath}:${index + 1}`;
    if (isAllowedReference(relativePath)) {
      allowedMatches.push(item);
    } else {
      matches.push(item);
    }
  });
}

if (matches.length) {
  console.error("Secret scan failed. Remove real credentials from these files:");
  matches.forEach((item) => console.error(`- ${item}`));
  process.exit(1);
}

console.log(`Secret scan passed (${allowedMatches.length} allowed example/documentation references ignored).`);
