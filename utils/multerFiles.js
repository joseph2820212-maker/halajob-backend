import multer from "multer";
import path from "path";
import { existsSync, mkdirSync } from "fs";

// جذور مجلدات الرفع
const UPLOADS_ROOT = path.resolve("uploads");
const DOCS_DIR = "files"; // لحفظ pdf/docx/txt

// تنظيف الاسم
const sanitizeFileName = (originalName = "") => {
  const ext = path.extname(originalName);
  const base = path.basename(originalName, ext);
  return `${base.replace(/[^a-zA-Z0-9_-]/g, "_").replace(/\s+/g, "_").toLowerCase()}${ext.toLowerCase()}`;
};

// توليد جزء عشوائي قصير يمنع التصادم
const rand = () => Math.random().toString(36).slice(2, 8);

// الامتدادات المسموحة
const ALLOWED_EXTS = [".pdf"];
const DOC_EXTS = [".pdf"];

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const subdir = DOC_EXTS.includes(ext) ? DOCS_DIR : ""; // doc/pdf/txt إلى uploads/files، والباقي إلى uploads/
    const destPath = path.join(UPLOADS_ROOT, subdir);

    // تأكد من وجود المجلد
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
    return cb(new Error("Unsupported file type!"), false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 4 * 1024 * 1024, // 4MB
    files: 1,                  // ملف واحد في كل طلب (عدّلها إن احتجت)
  },
});

export default upload;
