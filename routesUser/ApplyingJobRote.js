import express from 'express';
import { authUser } from '../middlewares/userAuth.js';
import ApplyingJobController from '../controllers/app/JobData/ApplyingJobController.js';

// إعداد التخزين للملفات



const router = express.Router();

// رفع ملف واحد مع البيانات
router.post('/insert/:id',authUser, ApplyingJobController.applyJob);

// استرجاع البيانات


export default router;
