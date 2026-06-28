import http from "http";
import { spawn } from "child_process";

const port = Number(process.env.WEB_SMOKE_PORT || 4173);
const host = process.env.WEB_SMOKE_HOST || "127.0.0.1";
const baseUrl = process.argv[2] || `http://${host}:${port}`;
const previewCommand = process.platform === "win32" ? "cmd.exe" : "npm";
const previewArgs =
  process.platform === "win32"
    ? ["/d", "/s", "/c", "npm", "--prefix", "web", "run", "preview", "--", "--host", host, "--port", String(port)]
    : ["--prefix", "web", "run", "preview", "--", "--host", host, "--port", String(port)];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForHttp = async (url, timeoutMs = 30000) => {
  const started = Date.now();
  let lastError = null;

  while (Date.now() - started < timeoutMs) {
    try {
      await new Promise((resolve, reject) => {
        const request = http.get(url, (response) => {
          response.resume();
          response.statusCode && response.statusCode < 500
            ? resolve()
            : reject(new Error(`HTTP ${response.statusCode}`));
        });
        request.on("error", reject);
        request.setTimeout(3000, () => {
          request.destroy(new Error("preview_timeout"));
        });
      });
      return;
    } catch (error) {
      lastError = error;
      await wait(500);
    }
  }

  throw lastError || new Error("preview_not_ready");
};

const run = (command, args, options = {}) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit", shell: false, ...options });
    child.on("error", reject);
    child.on("exit", (code) => {
      code === 0 ? resolve() : reject(new Error(`${command} exited with ${code}`));
    });
  });

const stopProcessTree = async (child) => {
  if (!child?.pid || child.exitCode !== null) return;

  if (process.platform === "win32") {
    await run("taskkill", ["/pid", String(child.pid), "/t", "/f"]).catch(() => null);
    return;
  }

  child.kill("SIGTERM");
};

const preview = spawn(
  previewCommand,
  previewArgs,
  { stdio: "inherit", shell: false }
);

try {
  await waitForHttp(baseUrl);
  await run(process.execPath, ["scripts/smokeWebPortals.js", baseUrl]);
} finally {
  await stopProcessTree(preview);
}
