import express from 'express';
import multer from '../utils/multer.js';
import controller from '../controllers/dash/CurrencyController.js';

// إعداد التخزين للملفات


const upload = multer; // تكوين Multer

const router = express.Router();

// رفع ملف واحد مع البيانات
router.get('/get', upload.none(), controller.get);
router.get('/getOne', upload.none(), controller.getOne);
router.post('/create', upload.none(), controller.create);
router.post('/update/:id', upload.none(), controller.update);
router.post('/delete/:id', upload.none(), controller.remove);
// استرجاع البيانات


export default router;
