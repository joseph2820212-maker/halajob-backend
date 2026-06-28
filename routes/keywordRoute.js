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
router.get('/log', upload.none(), controller.logKeyword);
// استرجاع البيانات


export default router;
