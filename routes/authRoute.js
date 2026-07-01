import express from 'express';
import multer from '../utils/multer.js';
import Login from '../controllers/dash/authController.js';
import { isAdmin } from '../middlewares/isAdmin.js';
import { checkPermission } from '../middlewares/checkPermission.js';
import validate from '../middlewares/validate.js';
import adminSchemas from '../validations/admin.validation.js';

const upload = multer;
const router = express.Router();

// Creating a dashboard user grants a role + permissions, so it must require
// the same authority as the resource-router admin-create path. isAdmin alone
// only proves the caller is a dash account (any role_number), which would let
// a limited operator mint a full platform admin.
const canCreateDashboardUser = checkPermission([
  'admins.create',
  'admins.manage',
  'users.create',
  'users.manage',
  'resources.create',
  'resources.manage',
]);

router.post('/login', upload.none(), Login.auditMissingDashboardLoginCredentials, validate(adminSchemas.dashboardLoginSchema), Login.login);
router.post('/refresh', upload.none(), validate(adminSchemas.dashboardRefreshSchema), Login.refresh);
router.post('/logout', upload.none(), validate(adminSchemas.dashboardLogoutSchema), Login.logout);
router.get('/me', isAdmin, Login.me);
router.post('/admins', isAdmin, canCreateDashboardUser, upload.none(), validate(adminSchemas.dashboardCreateUserSchema), Login.createDashboardUser);
router.post('/create-admin', isAdmin, canCreateDashboardUser, upload.none(), validate(adminSchemas.dashboardCreateUserSchema), Login.createDashboardUser);

export default router;
