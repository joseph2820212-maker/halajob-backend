import express from 'express';
import { authUser } from '../middlewares/userAuth.js';
import CreateJobRoleController from '../controllers/app/Jobs/CreateJobRoleController.js';
import CreateJobController from '../controllers/app/Jobs/CreateJobController.js';

// إعداد التخزين للملفات



const router = express.Router();

// رفع ملف واحد مع البيانات
router.get('/job-role',authUser, CreateJobRoleController.whatIsMyRole);
router.post('/create',authUser, CreateJobController.create);

// استرجاع البيانات


export default router;
