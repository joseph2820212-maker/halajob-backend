import express from 'express';
import { authUser } from '../middlewares/userAuth.js';
import validate from '../middlewares/validate.js';
import authSchemas from '../validations/authValidations.js';
import multer from '../utils/multer.js';
import Register from '../controllers/app/Auth/RegisterController.js';
import Login from '../controllers/app/Auth/LoginController.js';
import PassCodeController from '../controllers/app/Auth/PassCodeController.js';
import ResendOtpController from '../controllers/app/Auth/ResendOtpController.js';
import ForgotPassword from '../controllers/app/Auth/ForgotPasswordController.js';
import PassCodeForgotPasswordController from '../controllers/app/Auth/PassCodeForgotPasswordController.js';
import ForGotPasswordResetPasswordController from '../controllers/app/Auth/ForGotPasswordResetPasswordController.js';
import UpdateProfileController from '../controllers/app/Auth/UpdateProfileController.js';
import CampusAuthController from '../controllers/app/Auth/CampusAuthController.js';

// إعداد التخزين للملفات


const upload = multer; // تكوين Multer

const router = express.Router();

// رفع ملف واحد مع البيانات
router.post('/register', upload.none(), validate(authSchemas.registerSchema), Register.register);
router.post('/campus/register', upload.none(), CampusAuthController.campusRegister);
router.post('/campus/university-login', upload.none(), CampusAuthController.universityLogin);
router.post('/login', upload.none(), validate(authSchemas.loginSchema), Login.login);
router.post('/logout', upload.none(), Login.logout);
router.post('/logout-all', authUser, upload.none(), Login.logoutAll);
router.post('/refresh-token', upload.none(), validate(authSchemas.refreshTokenSchema), Login.refreshToken);
router.post("/passcode-verify", validate(authSchemas.passcodeVerifySchema), PassCodeController.passcodeVerify);
router.post("/passcode-forgot-password", validate(authSchemas.passcodeVerifySchema), PassCodeForgotPasswordController.passcodeVerify);
router.post("/resend-otp", validate(authSchemas.resendOtpSchema), ResendOtpController.resendOtp);
router.post("/forgot-password", validate(authSchemas.forgotPasswordSchema), ForgotPassword.forgotPassword);
router.post("/resetPassword", validate(authSchemas.forgotResetPasswordSchema), ForGotPasswordResetPasswordController.resetPassword);
router.post("/update-image",authUser,upload.single("image"), UpdateProfileController.updateImage);
router.post("/update-profile",authUser, UpdateProfileController.updateProfile);


// استرجاع البيانات


export default router;
