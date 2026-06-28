import express from 'express';
import { authUser } from '../middlewares/userAuth.js';
import { requireAppAccount } from '../middlewares/appAccountGuard.js';
import validate from "../middlewares/validate.js";
import seekerSchemas from "../validations/seeker.validation.js";
import multer from '../utils/multerFiles.js';
import ProfileController from '../controllers/app/Employee/ProfileController.js';
import EditProfileController from '../controllers/app/Employee/EditProfileController.js';


// إعداد التخزين للملفات


const upload = multer; // تكوين Multer

const router = express.Router();

// رفع ملف واحد مع البيانات
router.post('/profile-update', authUser, requireAppAccount('employee'), upload.none(), validate(seekerSchemas.profileBodySchema), EditProfileController.update);
router.get('/profile-get', authUser, requireAppAccount('employee'), upload.none(), ProfileController.profile);

// استرجاع البيانات


export default router;
