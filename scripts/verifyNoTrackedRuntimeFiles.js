import { execFileSync } from "node:child_process";

const runtimePathPrefixes = ["uploads/", "cv/generated/", "logs/", "backups/"];

const normalize = (value) => String(value || "").replace(/\\/g, "/");

let trackedFiles = [];
try {
  trackedFiles = execFileSync("git", ["ls-files"], { encoding: "utf8" })
    .split(/\r?\n/)
    .map(normalize)
    .filter(Boolean);
} catch (error) {
  console.warn("Skipping tracked runtime file check because git is unavailable.");
  process.exit(0);
}

const trackedRuntimeFiles = trackedFiles.filter((filePath) =>
  runtimePathPrefixes.some((prefix) => filePath.startsWith(prefix))
);

if (trackedRuntimeFiles.length) {
  console.error("Runtime/generated files are tracked by Git. Remove them from the index:");
  trackedRuntimeFiles.forEach((filePath) => console.error(`- ${filePath}`));
  process.exit(1);
}

console.log("Tracked runtime file check passed.");
