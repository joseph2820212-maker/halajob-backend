import express from 'express';
import RoleRoute from "./RoleRoute.js"
import PermissionRote from "./PermissionRote.js"
import JopNameRote from "./JopNameRote.js"
import JopServiceRote from "./JopServiceRote.js"
import JopTypeRote from "./JopTypeRote.js"
import JopSalaryRote from "./JopSalaryRote.js";
import exselRote from "./exselRote.js";
import CompanyRote from "./CompanyRote.js";
import CountryRote from "./CountryRote.js";
import CurrencyRote from "./CurrencyRote.js";
import WorkTimeRote from "./WorkTimeRote.js";
import JobRote from "./JobRote.js";

import fs from 'fs';
import path from 'path';
const FILES_DIRECTORY = path.resolve(process.env.FILES_DIRECTORY || './uploads');

const router = express.Router();


router.use('/Role', RoleRoute);
router.use('/Permission', PermissionRote);
router.use('/JopName', JopNameRote);
router.use('/JopService', JopServiceRote);
router.use('/JopType', JopTypeRote);
router.use('/JopSalary', JopSalaryRote);
router.use('/exsel', exselRote);
router.use('/Company', CompanyRote);
router.use('/Country', CountryRote);
router.use('/Currency', CurrencyRote);
router.use('/WorkTime', WorkTimeRote);
router.use('/Job', JobRote);

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



