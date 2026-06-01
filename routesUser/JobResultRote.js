import express from 'express';
import { authUser } from '../middlewares/userAuth.js';
import { requireAppAccount } from '../middlewares/appAccountGuard.js';
import JobDataController from '../controllers/app/Jobs/JobDataController.js';
import JobApplyingController from '../controllers/app/Jobs/JobApplyingController.js';

// إعداد التخزين للملفات



const router = express.Router();

// رفع ملف واحد مع البيانات
router.get('/get-by-id/:id',authUser, requireAppAccount('company'), JobDataController.getJobById);
router.get('/get-job-rating/:id',authUser, requireAppAccount('company'), JobDataController.getJobRatingStats);
router.get('/get-job-review/:id',authUser, requireAppAccount('company'), JobDataController.getJobReviews);
router.get('/get-job-savers/:id',authUser, requireAppAccount('company'), JobDataController.getJobSavers);
router.get('/get-created-job',authUser, requireAppAccount('company'), JobDataController.getCreatedJobs);
router.get('/get-job-applicant/:id',authUser, requireAppAccount('company'), JobApplyingController.getJobApplicants);

// استرجاع البيانات


export default router;
