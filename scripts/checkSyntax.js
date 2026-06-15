import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";

const root = process.cwd();
const ignoredDirs = new Set([".git", "node_modules", "uploads", "cv", "backups", "logs"]);

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

const failures = [];

for (const file of walk(root)) {
  const result = spawnSync(process.execPath, ["--check", file], {
    cwd: root,
    encoding: "utf8",
  });

  if (result.status !== 0) {
    failures.push({
      file: path.relative(root, file),
      error: result.stderr || result.stdout,
    });
  }
}

if (failures.length) {
  console.error("Syntax check failed:");
  failures.forEach(({ file, error }) => {
    console.error(`\n${file}`);
    console.error(error.trim());
  });
  process.exit(1);
}

console.log("all js syntax checks passed");
