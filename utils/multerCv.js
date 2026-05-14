import multer from "multer";
import path from "path";
import { existsSync, mkdirSync } from "fs";

const UPLOADS_ROOT = path.resolve("cv");
const DOCS_DIR = "cvUpload";

const sanitizeFileName = (originalName = "") => {
  const ext = path.extname(originalName);
  const base = path.basename(originalName, ext);

  return `${base
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/\s+/g, "_")
    .toLowerCase()}${ext.toLowerCase()}`;
};

const rand = () => Math.random().toString(36).slice(2, 8);

const ALLOWED_EXTS = [".pdf"];
const DOC_EXTS = [".pdf"];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const subdir = DOC_EXTS.includes(ext) ? DOCS_DIR : "";
    const destPath = path.join(UPLOADS_ROOT, subdir);

    if (!existsSync(destPath)) {
      mkdirSync(destPath, { recursive: true });
    }

    cb(null, destPath);
  },

  filename: (req, file, cb) => {
    const safe = sanitizeFileName(file.originalname || "file");
    const ext = path.extname(safe).toLowerCase();
    const base = path.basename(safe, ext);

    cb(null, `${Date.now()}-${rand()}-${base}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname || "").toLowerCase();

  if (!ALLOWED_EXTS.includes(ext)) {
    return cb(new Error("unsupported_file_type"), false);
  }

  cb(null, true);
};

const multerCv = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 4 * 1024 * 1024,
    files: 1,
  },
});

export default multerCv;