import express from 'express';
import { authUser } from '../middlewares/userAuth.js';
import CreateJobRoleController from '../controllers/app/Jobs/CreateJobRoleController.js';
import CreateJobController from '../controllers/app/Jobs/CreateJobController.js';
import GetJobControllerById from '../controllers/app/Jobs/GetJobController.js';
import UpdateJobController from '../controllers/app/Jobs/UpdateJobController.js';
import GetJobController from '../controllers/app/JobData/GetJobController.js';
import GetPopularController from '../controllers/app/JobData/GetPopularController.js';
authUser
// إعداد التخزين للملفات



const router = express.Router();

// رفع ملف واحد مع البيانات
router.get('/job-role',authUser, CreateJobRoleController.whatIsMyRole);
router.post('/create',authUser, CreateJobController.create);
router.post('/update/:id',authUser, UpdateJobController.update);
router.get('/get-single-job/:id',authUser, GetJobControllerById.getById);

router.get('/get', GetJobController.get);
router.get('/get-popular', GetPopularController.get);
router.get('/get-by-id/:id', GetJobController.getById);

// استرجاع البيانات


export default router;
