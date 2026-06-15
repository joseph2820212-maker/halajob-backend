import fs from "fs";
import path from "path";

const root = process.cwd();
const ignoredDirs = new Set([".git", "node_modules", "uploads", "cv", "backups", "logs"]);
const importPattern =
  /(?:import|export)\s+(?:[^'"()]+?\s+from\s+)?["'](\.{1,2}\/[^"']+)["']|import\s*\(\s*["'](\.{1,2}\/[^"']+)["']\s*\)|require\s*\(\s*["'](\.{1,2}\/[^"']+)["']\s*\)/g;

const walk = (dir, files = []) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!ignoredDirs.has(entry.name)) walk(path.join(dir, entry.name), files);
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".js")) {
      files.push(path.join(dir, entry.name));
    }
  }

  return files;
};

const hasExactCase = (target) => {
  const relative = path.relative(root, target);
  if (relative.startsWith("..")) return fs.existsSync(target);

  let current = root;
  for (const segment of relative.split(path.sep)) {
    const entries = fs.readdirSync(current);
    if (!entries.includes(segment)) return false;
    current = path.join(current, segment);
  }

  return true;
};

const candidatesFor = (base) => [
  base,
  `${base}.js`,
  `${base}.json`,
  path.join(base, "index.js"),
];

const failures = [];

for (const file of walk(root)) {
  const source = fs.readFileSync(file, "utf8");
  const fileDir = path.dirname(file);

  for (const match of source.matchAll(importPattern)) {
    const specifier = match[1] || match[2] || match[3];
    const base = path.resolve(fileDir, specifier);
    const resolved = candidatesFor(base).find((candidate) => fs.existsSync(candidate));

    if (!resolved) {
      failures.push(`${path.relative(root, file)} -> ${specifier} (missing)`);
      continue;
    }

    if (!hasExactCase(resolved)) {
      failures.push(`${path.relative(root, file)} -> ${specifier} (case mismatch)`);
    }
  }
}

if (failures.length) {
  console.error("Relative import check failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("relative import check passed");
