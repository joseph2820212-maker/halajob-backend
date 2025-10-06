import express from 'express';
import AuthRote from './AuthRote.js';
import CompanyRote from './CompanyRote.js';
import HelperRote from './HelperRote.js';
import JobRote from './JobRote.js';
import EmployeeRote from './EmployeeRote.js';
import JobInformationRote from './JobInformationRote.js';
import ApplyingJobRote from './ApplyingJobRote.js';
import JobResultRote from './JobResultRote.js';
import JobProfileRote from './JobProfileRote.js';


const router = express.Router();
router.use('/auth', AuthRote);
router.use('/company', CompanyRote);
router.use('/helper', HelperRote);
router.use('/job', JobRote);
router.use('/employee', EmployeeRote);
router.use('/job-information', JobInformationRote);
router.use('/applying-job', ApplyingJobRote);
router.use('/job-result', JobResultRote);
router.use('/job-profile', JobProfileRote);

export default router;