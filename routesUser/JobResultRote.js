import express from 'express';
import { authUser } from '../middlewares/userAuth.js';
import JobInformation from '../controllers/app/JobData/JobInformation.js';
import JobDataController from '../controllers/app/Jobs/JobDataController.js';
import JobApplyingController from '../controllers/app/Jobs/JobApplyingController.js';

// إعداد التخزين للملفات



const router = express.Router();

// رفع ملف واحد مع البيانات
router.get('/get-by-id/:id',authUser, JobDataController.getJobById);
router.get('/get-job-rating/:id',authUser, JobDataController.getJobRatingStats);
router.get('/get-job-review/:id',authUser, JobDataController.getJobReviews);
router.get('/get-job-savers/:id',authUser, JobDataController.getJobSavers);
router.get('/get-job-applicant/:id',authUser, JobApplyingController.getJobApplicants);

// استرجاع البيانات


export default router;
