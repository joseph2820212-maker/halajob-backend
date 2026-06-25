import multer from 'multer';
import path from 'path';
import { existsSync, mkdirSync } from 'fs';
import { randomBytes } from 'crypto';

const UPLOADS_ROOT = path.resolve('uploads');
const DOCS_DIR = 'files';

const ALLOWED_FILES = {
  '.doc': ['application/msword'],
  '.docx': [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  '.jpg': ['image/jpeg'],
  '.jpeg': ['image/jpeg'],
  '.pdf': ['application/pdf'],
  '.png': ['image/png'],
  '.webp': ['image/webp'],
};

const DOC_EXTS = ['.pdf', '.doc', '.docx'];

const sanitizeFileName = (originalName = '') => {
  const ext = path.extname(originalName).toLowerCase();
  const base = path.basename(originalName, ext);
  return `${base
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/\s+/g, '_')
    .toLowerCase()}${ext}`;
};

const rand = () => randomBytes(8).toString('hex');

const hasAllowedMime = (file, ext) => {
  const allowed = ALLOWED_FILES[ext];
  if (!allowed) return false;
  if (!file.mimetype) return true;
  return allowed.includes(file.mimetype);
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const subdir = DOC_EXTS.includes(ext) ? DOCS_DIR : '';
    const destPath = path.join(UPLOADS_ROOT, subdir);

    if (!existsSync(destPath)) mkdirSync(destPath, { recursive: true });
    cb(null, destPath);
  },
  filename: (req, file, cb) => {
    const safe = sanitizeFileName(file.originalname || 'file');
    const ext = path.extname(safe).toLowerCase();
    const base = path.basename(safe, ext);
    cb(null, `${Date.now()}-${rand()}-${base}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname || '').toLowerCase();
  if (!hasAllowedMime(file, ext)) {
    return cb(new Error('unsupported_file_type'), false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 4 * 1024 * 1024,
    files: 1,
  },
});

export default upload;
