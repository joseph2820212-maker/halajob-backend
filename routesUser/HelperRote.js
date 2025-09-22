import express from 'express';
import JobNameHelperController from '../controllers/app/Helper/JobNameHelperController.js';
import JobSalaryHelperController from '../controllers/app/Helper/JobSalaryHelperController.js';
import JobServiceHelperController from '../controllers/app/Helper/JobServiceHelperController.js';
import JobTypeHelperController from '../controllers/app/Helper/JobTypeHelperController.js';
import JobLocationHelperController from '../controllers/app/Helper/JobLocationHelperController.js';
import JobTimeHelperController from '../controllers/app/Helper/JobTimeHelperController.js';

// إعداد التخزين للملفات



const router = express.Router();

// رفع ملف واحد مع البيانات
router.get('/job-name', JobNameHelperController.search);
router.get('/job-salary', JobSalaryHelperController.search);
router.get('/job-salary-get', JobSalaryHelperController.get);
router.get('/job-service', JobServiceHelperController.search);
router.get('/job-type', JobTypeHelperController.search);
router.get('/job-type-get', JobTypeHelperController.get);
router.get('/job-location', JobLocationHelperController.search);
router.get('/job-time', JobTimeHelperController.search);
router.get('/job-time-get', JobTimeHelperController.get);

// استرجاع البيانات


export default router;
