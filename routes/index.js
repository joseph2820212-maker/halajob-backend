import express from 'express';
import RoleRoute from "./RoleRoute.js"
import PermissionRoute from "./PermissionRoute.js"
import JobNameRoute from "./JobNameRoute.js"
import JobServiceRoute from "./JobServiceRoute.js"
import JobTypeRoute from "./JobTypeRoute.js"
import JobSalaryRoute from "./JobSalaryRoute.js";
import exselRoute from "./exselRoute.js";
import CompanyRoute from "./CompanyRoute.js";
import CountryRoute from "./CountryRoute.js";
import CurrencyRoute from "./CurrencyRoute.js";
import WorkTimeRoute from "./WorkTimeRoute.js";
import JobRoute from "./JobRoute.js";
import FontRoute from "./FontRoute.js";
import ColorRoute from "./ColorRoute.js";
import ResumeRoute from "./ResumeRoute.js";
import keywordRoute from "./keywordRoute.js";
import authRoute from "./authRoute.js";

import fs from 'fs';
import path from 'path';
const FILES_DIRECTORY = path.resolve(process.env.FILES_DIRECTORY || './uploads');

const router = express.Router();

router.use('/auth', authRoute);
router.use('/Role', RoleRoute);
router.use('/Permission', PermissionRoute);
router.use('/JobName', JobNameRoute);
router.use('/JobService', JobServiceRoute);
router.use('/JobType', JobTypeRoute);
router.use('/JobSalary', JobSalaryRoute);
router.use('/exsel', exselRoute);
router.use('/Company', CompanyRoute);
router.use('/Country', CountryRoute);
router.use('/Currency', CurrencyRoute);
router.use('/WorkTime', WorkTimeRoute);
router.use('/Job', JobRoute);
router.use('/Color', ColorRoute);
router.use('/Font', FontRoute);
router.use('/Resume', ResumeRoute);
router.use('/Keyword', keywordRoute);

router.get('/image/:name', (req, res) => {
  const fileName = req.params.name;
  
  // res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin'); 
  // res.setHeader('Content-Type', 'image/png'); 
  
  // تحقق من اسم الملف
  if (!fileName || fileName.includes('..')) {
    return res.status(400).json({ error: 'Invalid file name' });
  }
  let filePath=""
  if (!fileName.endsWith(".pdf")) {
   filePath = path.join(FILES_DIRECTORY, fileName);
    
  }else{
  filePath = path.join(FILES_DIRECTORY+"/files", fileName);

  }
  // تحديد مسار الملف

  // تحقق من وجود الملف
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      return res.status(404).json({ error: 'File not found' });
    }

    // إرسال الملف
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error('Error sending file:', err);
        res.status(500).json({ error: 'Failed to send file' });
      }
    });
  });
});
router.get('/image/uploads/:name', (req, res) => {
  const fileName = req.params.name;
  
  // res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin'); 
  // res.setHeader('Content-Type', 'image/png'); 
  
  // تحقق من اسم الملف
  if (!fileName || fileName.includes('..')) {
    return res.status(400).json({ error: 'Invalid file name' });
  }
  let filePath=""
  if (!fileName.endsWith(".pdf")) {
   filePath = path.join(FILES_DIRECTORY, fileName);
    
  }else{
  filePath = path.join(FILES_DIRECTORY+"/files", fileName);

  }
  // تحديد مسار الملف

  // تحقق من وجود الملف
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      return res.status(404).json({ error: 'File not found' });
    }

    // إرسال الملف
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error('Error sending file:', err);
        res.status(500).json({ error: 'Failed to send file' });
      }
    });
  });
});
export default router;



