import multer from 'multer';
import path from 'path';
import { existsSync, mkdirSync } from 'fs';
import { randomBytes } from 'crypto';

const UPLOADS_ROOT = path.resolve('uploads');

const ALLOWED_FILES = {
  '.jpg': ['image/jpeg'],
  '.jpeg': ['image/jpeg'],
  '.png': ['image/png'],
  '.webp': ['image/webp'],
  '.pdf': ['application/pdf'],
  '.xlsx': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  '.csv': ['text/csv', 'application/csv', 'application/vnd.ms-excel'],
  '.ttf': ['font/ttf', 'application/x-font-ttf'],
};

const sanitizeFileName = (originalName = '') => {
  const extension = path.extname(originalName).toLowerCase();
  const baseName = path.basename(originalName, extension);
  return `${baseName
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/\s+/g, '_')
    .toLowerCase()}${extension}`;
};

const rand = () => randomBytes(8).toString('hex');

const hasAllowedMime = (file, ext) => {
  const allowed = ALLOWED_FILES[ext];
  if (!allowed) return false;
  if (!file.mimetype) return true;
  return allowed.includes(file.mimetype);
};

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      if (!existsSync(UPLOADS_ROOT)) mkdirSync(UPLOADS_ROOT, { recursive: true });
      cb(null, UPLOADS_ROOT);
    },
    filename: (req, file, cb) => cb(null, `${Date.now()}-${rand()}-${sanitizeFileName(file.originalname || 'file')}`),
  }),
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (!hasAllowedMime(file, ext)) {
      return cb(new Error('unsupported_file_type'), false);
    }
    cb(null, true);
  },
  limits: {
    fileSize: 4 * 1024 * 1024,
    files: 10,
  },
});

export default upload;
