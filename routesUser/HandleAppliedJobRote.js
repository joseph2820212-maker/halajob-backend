import express from 'express';
import { authUser } from '../middlewares/userAuth.js';
import { requireAppAccount } from '../middlewares/appAccountGuard.js';
import ChangeAppliedJobStatus from '../controllers/app/HandleAppliedJob/ChangeAppliedJobStatus.js';
import SendInterView from '../controllers/app/HandleAppliedJob/SendInterView.js';

const router = express.Router();

// رفع ملف واحد مع البيانات
router.post("/change-job-status/:id",authUser, requireAppAccount('company'), ChangeAppliedJobStatus.changeStatus);
router.post("/send-interview/:id",authUser, requireAppAccount('company'), SendInterView.SendInterView);

// استرجاع البيانات


export default router;
