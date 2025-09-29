
import express from 'express';
import multer from '../utils/multer.js';
import controller from '../controllers/dash/uploadExelController.js';
import UploadJobName from '../controllers/dash/UploadJobName.js';

// إعداد التخزين للملفات


const upload = multer; // تكوين Multer

const router = express.Router();

// رفع ملف واحد مع البيانات
router.post('/create', upload.single("file"), controller.create);
router.post('/csv', upload.single("file"), controller.csv);
router.post('/exsel', upload.single("file"), UploadJobName.uploadExcel);

// استرجاع البيانات


export default router;
