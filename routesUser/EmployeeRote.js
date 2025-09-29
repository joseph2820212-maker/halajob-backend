import express from 'express';
import { authUser } from '../middlewares/userAuth.js';
import multer from '../utils/multerFiles.js';
import ProfileController from '../controllers/app/Employee/ProfileController.js';
import EditProfileController from '../controllers/app/Employee/EditProfileController.js';


// إعداد التخزين للملفات


const upload = multer; // تكوين Multer

const router = express.Router();

// رفع ملف واحد مع البيانات
router.post('/profile-update',authUser, upload.none(), EditProfileController.update);
router.get('/profile-get',authUser, upload.none(), ProfileController.profile);

// استرجاع البيانات


export default router;
