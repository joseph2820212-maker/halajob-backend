
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
if (process.env.NODE_ENV !== 'production') {
  router.get('/insert', InsertDemoDataController.insert);
}

// استرجاع البيانات


export default router;
