import express from 'express';
import controller from '../controllers/dash/adminDashboardController.js';

const router = express.Router();

router.get('/', controller.overview);
router.get('/overview', controller.overview);
router.get('/dash', controller.overview);
router.get('/tracking', controller.tracking);
router.get('/activity', controller.tracking);

export default router;
