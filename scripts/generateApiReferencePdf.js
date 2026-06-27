import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const generator = path.join(__dirname, "generateApiReferencePdf.py");

const candidates = [
  process.env.PYTHON,
  process.env.PYTHON3,
  process.env.CODEX_PYTHON,
  "python",
  "python3",
  process.platform === "win32" ? "py" : null,
].filter(Boolean);

for (const candidate of candidates) {
  const args = candidate === "py" ? ["-3", generator] : [generator];
  const result = spawnSync(candidate, args, {
    cwd: path.resolve(__dirname, ".."),
    stdio: "inherit",
    shell: false,
  });

  if (result.status === 0) {
    process.exit(0);
  }
}

if (!existsSync(generator)) {
  console.error(`Missing PDF generator: ${generator}`);
} else {
  console.error(
    [
      "Unable to run the API PDF generator.",
      "Install Python 3 with reportlab, or set PYTHON to the Python executable path.",
      "Example: PYTHON=C:\\\\Path\\\\To\\\\python.exe npm run docs:api-pdf",
    ].join("\n"),
  );
}

process.exit(1);
