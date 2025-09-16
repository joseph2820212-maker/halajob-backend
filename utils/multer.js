import multer from 'multer';
import path from 'path';

// Function to sanitize file name
const sanitizeFileName = (originalName) => {
  const extension = path.extname(originalName);
  const baseName = path.basename(originalName, extension);
  return `${baseName.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/\s+/g, '_').toLowerCase()}${extension}`;
};

// Multer config
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads'),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${sanitizeFileName(file.originalname)}`),
  }),
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!['.jpg', '.jpeg', '.png', '.svg', '.webp'].includes(ext)) {
      return cb(new Error('Unsupported file type!'), false);
    }
    cb(null, true);
  },
  limits: {
    fileSize: 4 * 1024 * 1024, // 4MB limit
  },
});

export default upload;
