// routes/fcmTokens.js
import express from 'express';
import { authUser } from '../middlewares/userAuth.js';
import FcmTokenController from '../controllers/app/FcmToken/FcmTokenController.js';

const router = express.Router();

router.get('/tokens', authUser, FcmTokenController.listTokens);
router.post('/tokens', authUser, express.json(), FcmTokenController.registerToken);
router.post('/update-tokens/:id', authUser, express.json(), FcmTokenController.updateToken);
router.post('/delete-tokens/:id', authUser, FcmTokenController.deleteToken);

export default router;
