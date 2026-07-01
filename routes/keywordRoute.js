import express from 'express';
import multer from '../utils/multer.js';
import controller from '../controllers/dash/keywordController.js';
import validate from '../middlewares/validate.js';
import adminSchemas from '../validations/admin.validation.js';

// إعداد التخزين للملفات


const upload = multer; // تكوين Multer

const router = express.Router();

// رفع ملف واحد مع البيانات
router.get('/get', upload.none(), controller.get);
router.post('/update/:id', upload.none(), validate(adminSchemas.keywordUpdateSchema), controller.updateKeyWord);
// logKeyword resets the keyword collection (deleteMany + create) from the
// bundled ar/en JSON. Was a GET; moved to POST because the operation writes
// to the DB and would be triggered by any browser prefetch or link crawler.
// GET returns 410 for one release cycle to surface stale callers.
router.post('/log', upload.none(), validate(adminSchemas.importUploadSchema), controller.logKeyword);
router.get('/log', (_req, res) =>
  res.status(410).json({
    success: false,
    message: 'gone',
    hint: 'POST /keyword/log (moved because the operation rebuilds the DB).',
  }),
);
// استرجاع البيانات


export default router;
