import express from 'express';
import multer from '../utils/multer.js';
import Login from '../controllers/dash/authController.js';
import { isAdmin } from '../middlewares/isAdmin.js';
import validate from '../middlewares/validate.js';
import adminSchemas from '../validations/admin.validation.js';

const upload = multer;
const router = express.Router();

router.post('/login', upload.none(), validate(adminSchemas.dashboardLoginSchema), Login.login);
router.post('/refresh', upload.none(), validate(adminSchemas.dashboardRefreshSchema), Login.refresh);
router.post('/logout', upload.none(), validate(adminSchemas.dashboardLogoutSchema), Login.logout);
router.get('/me', isAdmin, Login.me);
router.post('/admins', isAdmin, upload.none(), validate(adminSchemas.dashboardCreateUserSchema), Login.createDashboardUser);
router.post('/create-admin', isAdmin, upload.none(), validate(adminSchemas.dashboardCreateUserSchema), Login.createDashboardUser);

export default router;
