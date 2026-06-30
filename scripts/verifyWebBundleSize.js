import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");
const assetsDir = path.join(root, "web", "dist", "assets");
const maxChunkKb = Number.parseInt(process.env.WEB_BUNDLE_MAX_CHUNK_KB || "500", 10);
const maxChunkBytes = maxChunkKb * 1024;

if (!Number.isFinite(maxChunkKb) || maxChunkKb <= 0) {
  throw new Error("WEB_BUNDLE_MAX_CHUNK_KB must be a positive integer.");
}

if (!fs.existsSync(assetsDir)) {
  throw new Error(
    `Web bundle assets are missing at ${assetsDir}. Run npm --prefix web run build first.`,
  );
}

const jsChunks = fs
  .readdirSync(assetsDir, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith(".js"))
  .map((entry) => {
    const filePath = path.join(assetsDir, entry.name);
    return {
      name: entry.name,
      bytes: fs.statSync(filePath).size,
    };
  })
  .sort((left, right) => right.bytes - left.bytes);

if (jsChunks.length === 0) {
  throw new Error(`No JavaScript chunks were found in ${assetsDir}.`);
}

const oversized = jsChunks.filter((chunk) => chunk.bytes > maxChunkBytes);
const summary = jsChunks
  .slice(0, 8)
  .map((chunk) => `${chunk.name} ${(chunk.bytes / 1024).toFixed(1)} KiB`)
  .join("; ");

if (oversized.length > 0) {
  console.error(`Web bundle chunk limit is ${maxChunkKb} KiB.`);
  console.error("Oversized JavaScript chunks:");
  for (const chunk of oversized) {
    console.error(`  - ${chunk.name}: ${(chunk.bytes / 1024).toFixed(1)} KiB`);
  }
  console.error(`Largest chunks: ${summary}`);
  process.exit(1);
}

console.log(
  `Web bundle size guard passed: ${jsChunks.length} JS chunks, largest ${(
    jsChunks[0].bytes / 1024
  ).toFixed(1)} KiB of ${maxChunkKb} KiB. Largest chunks: ${summary}`,
);
