import express from 'express';
import { authUser } from '../middlewares/userAuth.js';
import ApplyingJobController from '../controllers/app/JobData/ApplyingJobController.js';

const router = express.Router();

// رفع ملف واحد مع البيانات
router.post('/insert/:id',authUser, ApplyingJobController.applyJob);
router.get('/get',authUser, ApplyingJobController.getAppliedJobs);



export default router;
