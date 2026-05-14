import express from 'express';
import multer from '../utils/multer.js';
import controller from '../controllers/dash/FontController.js';

// إعداد التخزين للملفات


const upload = multer; // تكوين Multer

const router = express.Router();

// رفع ملف واحد مع البيانات
router.get('/get', upload.none(), controller.get);
router.get('/getOne', upload.none(), controller.getOne);
router.post('/create', upload.single("file"), controller.create);
router.post('/update/:id', upload.single("file"), controller.update);
router.post('/delete/:id', upload.none(), controller.remove);
// استرجاع البيانات


export default router;
