import express from 'express';
import { authUser } from '../middlewares/userAuth.js';
import CreateJobRoleController from '../controllers/app/JobData/JobInformation.js';

// إعداد التخزين للملفات



const router = express.Router();

// رفع ملف واحد مع البيانات
router.post('/review-job/:id',authUser, CreateJobRoleController.reviewJob);
router.post('/rate-job/:id',authUser, CreateJobRoleController.rateJob);
router.post('/apply-outside/:id',authUser, CreateJobRoleController.applyOutsideJob);
router.post('/toggle-save-job/:id',authUser, CreateJobRoleController.toggleSaveJob);
router.get('/list-job-reviews/:id', CreateJobRoleController.listJobReviews);
router.get('/recompute-job-rating-breakdown/:id', CreateJobRoleController.recomputeJobRatingBreakdown);
router.get('/list-job-savers/:id', CreateJobRoleController.listJobSavers);

// استرجاع البيانات


export default router;
