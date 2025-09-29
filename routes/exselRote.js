
import express from 'express';
import multer from '../utils/multer.js';
import controller from '../controllers/dash/uploadExelController.js';

// إعداد التخزين للملفات


const upload = multer; // تكوين Multer

const router = express.Router();

// رفع ملف واحد مع البيانات
router.post('/create', upload.single("file"), controller.create);
router.post('/csv', upload.single("file"), controller.csv);

// استرجاع البيانات


export default router;
