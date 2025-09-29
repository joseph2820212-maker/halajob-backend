import express from 'express';
import AuthRote from './AuthRote.js';
import CompanyRote from './CompanyRote.js';
import HelperRote from './HelperRote.js';
import JobRote from './JobRote.js';
import EmployeeRote from './EmployeeRote.js';



const router = express.Router();
router.use('/auth', AuthRote);
router.use('/company', CompanyRote);
router.use('/helper', HelperRote);
router.use('/job', JobRote);
router.use('/employee', EmployeeRote);

export default router;