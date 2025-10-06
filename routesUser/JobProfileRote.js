import express from 'express';
import { authUser } from '../middlewares/userAuth.js';
import JobProfileController from '../controllers/app/JobProfile/JobProfileController.js';

// إعداد التخزين للملفات



const router = express.Router();

// رفع ملف واحد مع البيانات
router.get('/get-saved-job',authUser, JobProfileController.getSavedJob);
router.get('/get-applied-jobs',authUser, JobProfileController.getAppliedJobs);
router.get('/get-interviewed-jobs',authUser, JobProfileController.getInterviewedJobs);
router.get('/get-user-job-counts',authUser, JobProfileController.getUserJobCounts);

// استرجاع البيانات


export default router;
