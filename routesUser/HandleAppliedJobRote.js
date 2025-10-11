import express from 'express';
import { authUser } from '../middlewares/userAuth.js';
import ChangeAppliedJobStatus from '../controllers/app/HandleAppliedJob/ChangeAppliedJobStatus.js';
import SendInterView from '../controllers/app/HandleAppliedJob/SendInterView.js';

const router = express.Router();

// رفع ملف واحد مع البيانات
router.post("/change-job-status/:id",authUser,ChangeAppliedJobStatus.changeStatus);
router.post("/send-interview/:id",authUser,SendInterView.SendInterView);

// استرجاع البيانات


export default router;
