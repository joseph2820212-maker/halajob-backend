import express from 'express';
import { authUser } from '../middlewares/userAuth.js';
import { requireAppAccount } from '../middlewares/appAccountGuard.js';
import multer from '../utils/multerFiles.js';
import multerTow from '../utils/multer.js';
import CompanyProfileController from '../controllers/app/Company/CompanyProfileController.js';


// إعداد التخزين للملفات


const upload = multer; // تكوين Multer
const uploadImage = multerTow; // تكوين Multer

const router = express.Router();

// رفع ملف واحد مع البيانات
router.get("/profile-jobs",authUser, requireAppAccount('company'), CompanyProfileController.companyData);
router.get("/job-details/:id",authUser, requireAppAccount('company'), CompanyProfileController.getJobDetails);

// استرجاع البيانات


export default router;
