import sharp from "sharp";
import fs from "fs";
import path from "path";

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const normalizeForDb = (p) =>
  p
    .replace(/\\/g, "/")
    .replace(/^uploads\//, "")
    .replace(/^uploads\/tmp\//, "tmp/");

const safeUnlink = async (filePath) => {
  try {
    await fs.promises.unlink(filePath);
  } catch (_) {}
};

export const deleteImage = async (dbPath) => {
  if (!dbPath || typeof dbPath !== "string") return;

  try {
    const cleanPath = dbPath.replace(/^\/+/, "");
    const fullPath = path.join("uploads", cleanPath);
    await safeUnlink(fullPath);
  } catch (err) {
    console.error("Error deleting image:", err);
  }
};

export const deleteImages = async (paths = []) => {
  if (!Array.isArray(paths)) return;
  await Promise.all(paths.map((p) => deleteImage(p)));
};

export const processUploadImage = async (file, options = {}) => {
  if (!file?.path) return null;

  const {
    targetDir = "images",
    webpQuality = 80,
    keepOriginalFor = new Set([".svg", ".webp"]),
  } = options;

  const ext = path.extname(file.originalname).toLowerCase();
  const uploadsRoot = "uploads";
  const outputDir = path.join(uploadsRoot, targetDir);
  ensureDir(outputDir);

  const baseName = path
    .basename(file.filename, path.extname(file.filename))
    .replace(/[^a-zA-Z0-9_-]/g, "_");

  if (keepOriginalFor.has(ext)) {
    const finalName = `${baseName}${ext}`;
    const finalPath = path.join(outputDir, finalName);

    await fs.promises.rename(file.path, finalPath);
    return normalizeForDb(finalPath);
  }

  const finalName = `${baseName}.webp`;
  const finalPath = path.join(outputDir, finalName);

  await sharp(file.path).webp({ quality: webpQuality }).toFile(finalPath);
  await safeUnlink(file.path);

  return normalizeForDb(finalPath);
};