import express from 'express';
import { authUser } from '../middlewares/userAuth.js';
import validate from "../middlewares/validate.js";
import seekerSchemas from "../validations/seeker.validation.js";
import multer from '../utils/multerFiles.js';
import multerTow from '../utils/multer.js';
import CreateCompanyController from '../controllers/app/Company/CreateCompanyController.js';
import CompanyController from '../controllers/app/Company/CompanyController.js';


// إعداد التخزين للملفات


const upload = multer; // تكوين Multer
const uploadImage = multerTow; // تكوين Multer

const router = express.Router();

// رفع ملف واحد مع البيانات
router.post('/join-request',authUser, upload.none(), validate(seekerSchemas.companyBodySchema), CreateCompanyController.joinRequest);
router.post("/upload-file",authUser,upload.single("file"), validate(seekerSchemas.companyBodySchema), CreateCompanyController.uploadFile);
router.post("/delete-file",authUser, validate(seekerSchemas.companyFileDeleteSchema), CreateCompanyController.deleteFile);
router.get("/get-files",authUser,CreateCompanyController.getFileLinks);
router.get("/download-file",authUser,CreateCompanyController.downloadFile);
router.get("/my-company",authUser,CompanyController.get)
router.post("/update-my-company",authUser, validate(seekerSchemas.companyBodySchema), CompanyController.update)
router.post("/update-my-company-image",authUser,uploadImage.single("file"), validate(seekerSchemas.companyBodySchema), CompanyController.updateImage)

// استرجاع البيانات


export default router;
