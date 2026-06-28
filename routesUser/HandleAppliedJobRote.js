import express from 'express';
import { authUser } from '../middlewares/userAuth.js';
import { requireAppAccount } from '../middlewares/appAccountGuard.js';
import validate from "../middlewares/validate.js";
import seekerSchemas from "../validations/seeker.validation.js";
import ChangeAppliedJobStatus from '../controllers/app/HandleAppliedJob/ChangeAppliedJobStatus.js';
import SendInterView from '../controllers/app/HandleAppliedJob/SendInterView.js';

const router = express.Router();

// رفع ملف واحد مع البيانات
router.post("/change-job-status/:id",authUser, requireAppAccount('company'), validate(seekerSchemas.legacyApplicationStatusSchema), ChangeAppliedJobStatus.changeStatus);
router.post("/send-interview/:id",authUser, requireAppAccount('company'), validate(seekerSchemas.legacyInterviewCreateSchema), SendInterView.SendInterView);

// استرجاع البيانات


export default router;
