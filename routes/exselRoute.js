
import express from 'express';
import multer from '../utils/multer.js';
import controller from '../controllers/dash/uploadExelController.js';
import UploadJobName from '../controllers/dash/UploadJobName.js';
import InsertDemoDataController from '../controllers/dash/InsertDemoDataController.js';
import validate from '../middlewares/validate.js';
import adminSchemas from '../validations/admin.validation.js';

// إعداد التخزين للملفات


const upload = multer; // تكوين Multer

const router = express.Router();

// رفع ملف واحد مع البيانات
router.post('/create', upload.single("file"), validate(adminSchemas.importUploadSchema), controller.create);
router.post('/csv', upload.single("file"), validate(adminSchemas.importUploadSchema), controller.csv);
router.post('/exsel', upload.single("file"), validate(adminSchemas.importUploadSchema), UploadJobName.uploadExcel);
// Demo-data seeder. Never mounted in production. Was a GET, moved to POST
// because it does insertMany (writes) and browsers/crawlers can prefetch GETs.
// The GET responds 410 for one release cycle to surface any stale caller.
if (process.env.NODE_ENV !== 'production') {
  router.post('/insert', validate(adminSchemas.importUploadSchema), InsertDemoDataController.insert);
  router.get('/insert', (_req, res) =>
    res.status(410).json({
      success: false,
      message: 'gone',
      hint: 'POST /exsel/insert (moved because the operation writes to the DB).',
    }),
  );
}

// استرجاع البيانات


export default router;
