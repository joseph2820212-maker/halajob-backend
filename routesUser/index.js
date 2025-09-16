import express from 'express';
import AuthRote from './AuthRote.js';
import CompanyRote from './CompanyRote.js';



const router = express.Router();
router.use('/auth', AuthRote);
router.use('/company', CompanyRote);

export default router;