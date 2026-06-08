import express from 'express';
import multer from '../utils/multer.js';
import Login from '../controllers/dash/authController.js';
import { isAdmin } from '../middlewares/isAdmin.js';

const upload = multer;
const router = express.Router();

router.post('/login', upload.none(), Login.login);
router.post('/refresh', upload.none(), Login.refresh);
router.post('/logout', upload.none(), Login.logout);
router.get('/me', isAdmin, Login.me);
router.post('/admins', isAdmin, upload.none(), Login.createDashboardUser);
router.post('/create-admin', isAdmin, upload.none(), Login.createDashboardUser);

export default router;
