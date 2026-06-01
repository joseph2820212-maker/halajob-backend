import express from 'express';
import { authUser } from '../middlewares/userAuth.js';
import { requireAppAccount } from '../middlewares/appAccountGuard.js';
import JobProfileController from '../controllers/app/JobProfile/JobProfileController.js';

// إعداد التخزين للملفات



const router = express.Router();

// رفع ملف واحد مع البيانات
router.get('/get-saved-job',authUser, requireAppAccount('employee'), JobProfileController.getSavedJob);
router.get('/get-applied-jobs',authUser, requireAppAccount('employee'), JobProfileController.getAppliedJobs);
router.get('/get-interviewed-jobs',authUser, requireAppAccount('employee'), JobProfileController.getInterviewedJobs);
router.get('/get-user-job-counts',authUser, requireAppAccount('employee'), JobProfileController.getUserJobCounts);

// استرجاع البيانات


export default router;
