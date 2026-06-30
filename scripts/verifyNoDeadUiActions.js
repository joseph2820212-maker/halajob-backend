import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const flutterActionNamePattern =
  "(?:Pressed|Tap|LongPress|Submitted|FieldSubmitted|Changed|Selected|Select[A-Za-z0-9_]*)";
const sameFlutterCallback =
  "(?:(?!\\n\\s*on[A-Z][A-Za-z0-9_]*\\s*:)[\\s\\S])";
const targets = [
  {
    dir: "mobile/lib",
    extensions: new Set([".dart"]),
    patterns: [
      {
        re: new RegExp(
          `\\bon${flutterActionNamePattern}\\s*:\\s*\\([^)]*\\)\\s*(?:async\\s*)?=>\\s*(?:null|Future\\.value\\(\\)|void\\s+0)\\b`,
          "g",
        ),
        label: "no-op Flutter action expression",
      },
      {
        re: new RegExp(
          `\\bon${flutterActionNamePattern}\\s*:\\s*\\([^)]*\\)\\s*(?:async\\s*)?\\{\\s*\\}`,
          "g",
        ),
        label: "empty Flutter action block",
      },
      {
        re: new RegExp(
          `\\bon${flutterActionNamePattern}\\s*:[^,\\n]*\\?\\?\\s*\\(\\)\\s*(?:async\\s*)?\\{\\s*\\}`,
          "g",
        ),
        label: "empty Flutter fallback action",
      },
      {
        re: new RegExp(
          `\\bon${flutterActionNamePattern}\\s*:${sameFlutterCallback}{0,180}\\?${sameFlutterCallback}{0,180}(?::\\s*)?(?:\\([^)]*\\)\\s*)?(?:async\\s*)?\\{\\s*\\}`,
          "g",
        ),
        label: "empty Flutter ternary action branch",
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
        re: /\bon(?:Click|Submit)\s*=\s*\{[^}\n]*\?\?\s*\(?\s*\(\)\s*=>\s*\{\s*\}\s*\)?\s*\}/g,
        label: "empty React fallback action",
      },
      {
        re: /\bhref\s*=\s*["'](?:#|javascript:void\(0\))["']/g,
        label: "dead anchor href",
      },
      {
        re: /\bto\s*=\s*["']#["']/g,
        label: "dead router target",
      },
      {
        re: /<QueueTable\b(?:(?!\/?>)[\s\S])*\bsetToast\s*=/g,
        label: "legacy QueueTable string action prop",
      },
      {
        re: /\bmessage\.split\(["']:["']\)/g,
        label: "string-split UI action routing",
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

function findJsxTags(source, tagName) {
  const tags = [];
  const prefix = `<${tagName}`;
  let index = source.indexOf(prefix);

  while (index >= 0) {
    const afterName = source[index + prefix.length] || "";
    if (!/[A-Za-z0-9_$-]/.test(afterName)) {
      let braceDepth = 0;
      let quote = null;
      let escaped = false;
      let end = -1;

      for (let i = index + prefix.length; i < source.length; i += 1) {
        const ch = source[i];
        if (quote) {
          if (escaped) escaped = false;
          else if (ch === "\\") escaped = true;
          else if (ch === quote) quote = null;
          continue;
        }
        if (ch === '"' || ch === "'" || ch === "`") {
          quote = ch;
          continue;
        }
        if (ch === "{") {
          braceDepth += 1;
          continue;
        }
        if (ch === "}") {
          braceDepth = Math.max(0, braceDepth - 1);
          continue;
        }
        if (ch === ">" && braceDepth === 0) {
          end = i;
          break;
        }
      }

      if (end > index) {
        tags.push({ index, text: source.slice(index, end + 1) });
      }
    }

    index = source.indexOf(prefix, index + prefix.length);
  }

  return tags;
}

function extractJsxAttributeExpression(tagText, attrName) {
  const marker = `${attrName}=`;
  const attrIndex = tagText.indexOf(marker);
  if (attrIndex === -1) return null;
  let index = attrIndex + marker.length;
  while (/\s/.test(tagText[index] || "")) index += 1;
  if (tagText[index] !== "{") return null;

  let braceDepth = 1;
  let quote = null;
  let escaped = false;
  const start = index + 1;

  for (let i = start; i < tagText.length; i += 1) {
    const ch = tagText[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      quote = ch;
      continue;
    }
    if (ch === "{") {
      braceDepth += 1;
      continue;
    }
    if (ch === "}") {
      braceDepth -= 1;
      if (braceDepth === 0) return tagText.slice(start, i);
    }
  }

  return null;
}

function extractStringLiterals(expression) {
  const values = new Set();
  const re = /(["'])([^"'\\]*(?:\\.[^"'\\]*)*)\1/g;
  let match;
  while ((match = re.exec(expression || ""))) {
    values.add(match[2].replace(/\\(["'\\])/g, "$1"));
  }
  return [...values];
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasExplicitActionBranch(expression, action) {
  const escaped = escapeRegExp(action);
  return new RegExp(
    `\\baction\\s*===\\s*["']${escaped}["']|["']${escaped}["']\\s*===\\s*action|case\\s+["']${escaped}["']`,
  ).test(expression || "");
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
    if (file.endsWith(".tsx")) {
      for (const tag of findJsxTags(source, "button")) {
        if (/\bonClick\b/.test(tag.text) && !/\btype\s*=/.test(tag.text)) {
          failures.push(
            `${file}:${lineForIndex(source, tag.index)} has an onClick <button> without explicit type="button"`,
          );
        }
      }
      for (const tag of findJsxTags(source, "QueueTable")) {
        const actionsExpression = extractJsxAttributeExpression(
          tag.text,
          "actions",
        );
        const actionLabels = extractStringLiterals(actionsExpression);
        const onActionExpression = extractJsxAttributeExpression(
          tag.text,
          "onAction",
        );
        const hasVisibleActions = !/\bactions\s*=\s*\{\s*\[\s*\]\s*\}/.test(
          tag.text,
        );
        if (
          hasVisibleActions &&
          /\bonAction\s*=\s*\{\s*\(\s*\)\s*=>\s*(?:undefined|null|void\s+0|setToast\()/.test(
            tag.text,
          )
        ) {
          failures.push(
            `${file}:${lineForIndex(source, tag.index)} has visible QueueTable actions wired to a no-op/toast-only handler`,
          );
        }
        if (
          actionLabels.length > 1 &&
          /^\s*(?:\(\s*)?_action\b/.test(onActionExpression || "")
        ) {
          failures.push(
            `${file}:${lineForIndex(source, tag.index)} has multiple visible QueueTable actions but its inline handler ignores the action label`,
          );
        }
      }
      for (const tag of findJsxTags(source, "ActionBar")) {
        if (/\bonAction\s*=\s*\{\s*\(?\s*action\s*\)?\s*=>[\s\S]*\?[\s\S]*:/.test(tag.text)) {
          failures.push(
            `${file}:${lineForIndex(source, tag.index)} uses fallback ternary ActionBar routing instead of explicit action branches`,
          );
        }
        const actionsExpression = extractJsxAttributeExpression(
          tag.text,
          "actions",
        );
        const onActionExpression = extractJsxAttributeExpression(
          tag.text,
          "onAction",
        );
        for (const action of extractStringLiterals(actionsExpression)) {
          if (!hasExplicitActionBranch(onActionExpression, action)) {
            failures.push(
              `${file}:${lineForIndex(source, tag.index)} has ActionBar action "${action}" without an explicit onAction branch`,
            );
          }
        }
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
