import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const targets = [
  {
    dir: "mobile/lib",
    extensions: new Set([".dart"]),
    patterns: [
      {
        re: /\bon(?:Pressed|Tap|LongPress|Submitted)\s*:\s*\([^)]*\)\s*(?:async\s*)?=>\s*(?:null|Future\.value\(\)|void\s+0)\b/g,
        label: "no-op Flutter action expression",
      },
      {
        re: /\bon(?:Pressed|Tap|LongPress|Submitted)\s*:\s*\([^)]*\)\s*(?:async\s*)?\{\s*\}/g,
        label: "empty Flutter action block",
      },
    ],
  },
  {
    dir: "web/src",
    extensions: new Set([".ts", ".tsx"]),
    patterns: [
      {
        re: /\bon(?:Click|Submit)\s*=\s*\{\s*\([^)]*\)\s*=>\s*(?:undefined|null|void\s+0)\s*\}/g,
        label: "no-op React action expression",
      },
      {
        re: /\bon(?:Click|Submit)\s*=\s*\{\s*\([^)]*\)\s*=>\s*\{\s*\}\s*\}/g,
        label: "empty React action block",
      },
      {
        re: /\bhref\s*=\s*["'](?:#|javascript:void\(0\))["']/g,
        label: "dead anchor href",
      },
      {
        re: /\bto\s*=\s*["']#["']/g,
        label: "dead router target",
      },
    ],
  },
];

const failures = [];

function walk(dir, extensions, files = []) {
  const fullDir = path.join(root, dir);
  if (!fs.existsSync(fullDir)) {
    failures.push(`${dir} does not exist`);
    return files;
  }

  for (const entry of fs.readdirSync(fullDir, { withFileTypes: true })) {
    const fullPath = path.join(fullDir, entry.name);
    const relativePath = path.relative(root, fullPath).replaceAll(path.sep, "/");
    if (entry.isDirectory()) {
      walk(relativePath, extensions, files);
      continue;
    }
    if (entry.isFile() && extensions.has(path.extname(entry.name))) {
      files.push(relativePath);
    }
  }

  return files;
}

function lineForIndex(source, index) {
  return source.slice(0, index).split(/\r?\n/).length;
}

for (const target of targets) {
  for (const file of walk(target.dir, target.extensions)) {
    const source = fs.readFileSync(path.join(root, file), "utf8");
    for (const pattern of target.patterns) {
      pattern.re.lastIndex = 0;
      let match;
      while ((match = pattern.re.exec(source))) {
        failures.push(
          `${file}:${lineForIndex(source, match.index)} contains ${pattern.label}: ${match[0]}`,
        );
      }
    }
  }
}

if (failures.length) {
  console.error("Dead UI action guard failed:");
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log("Dead UI action guard passed.");
