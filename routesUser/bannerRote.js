import express from 'express';
import { authUser } from '../middlewares/userAuth.js';
import controller from '../controllers/app/banner/bannerController.js';
// إعداد التخزين للملفات



const router = express.Router();

router.get('/get', controller.get);

// استرجاع البيانات


export default router;
