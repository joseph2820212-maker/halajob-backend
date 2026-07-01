import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptsRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
);
const workspaceRoot = path.dirname(scriptsRoot);

const splitRepoRoots = {
  admin: process.env.HALAJOB_ADMIN_REPO || path.join(workspaceRoot, "halajob-admin"),
  mobile:
    process.env.HALAJOB_MOBILE_REPO || path.join(workspaceRoot, "halajob-mobile"),
  web:
    process.env.HALAJOB_WEB_REPO || path.join(workspaceRoot, "halajob-website"),
};

const normalize = (relativePath) => relativePath.replaceAll("\\", "/");

const splitCandidate = (relativePath) => {
  const normalized = normalize(relativePath);
  const [prefix, ...rest] = normalized.split("/");
  const repoRoot = splitRepoRoots[prefix];
  if (!repoRoot || rest.length === 0) return null;
  return path.join(repoRoot, ...rest);
};

export const resolveRepoPath = (relativePath) => {
  const monorepoPath = path.join(scriptsRoot, relativePath);
  if (fs.existsSync(monorepoPath)) return monorepoPath;

  const splitPath = splitCandidate(relativePath);
  if (splitPath && fs.existsSync(splitPath)) return splitPath;

  return splitPath || monorepoPath;
};

export const existsRepoPath = (relativePath) =>
  fs.existsSync(resolveRepoPath(relativePath));

export const readRepoFile = (relativePath) =>
  fs.readFileSync(resolveRepoPath(relativePath), "utf8");

export const listRepoFiles = (relativePath) => {
  const root = resolveRepoPath(relativePath);
  if (!fs.existsSync(root)) return [];

  const files = [];
  const walk = (absoluteDir, relativeDir) => {
    for (const entry of fs.readdirSync(absoluteDir, { withFileTypes: true })) {
      const absoluteEntry = path.join(absoluteDir, entry.name);
      const relativeEntry = `${relativeDir}/${entry.name}`;
      if (entry.isDirectory()) {
        walk(absoluteEntry, relativeEntry);
      } else if (entry.isFile()) {
        files.push(relativeEntry);
      }
    }
  };

  walk(root, normalize(relativePath));
  return files;
};
