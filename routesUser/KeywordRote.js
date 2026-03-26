import express from 'express';
import { authUser } from '../middlewares/userAuth.js';
import getKeyword from '../controllers/app/keyword/getKeyword.js';
// إعداد التخزين للملفات



const router = express.Router();

router.get('/get', getKeyword.get);

// استرجاع البيانات


export default router;
