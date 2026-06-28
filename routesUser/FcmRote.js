// routes/fcmTokens.js
import express from 'express';
import { authUser } from '../middlewares/userAuth.js';
import validate from "../middlewares/validate.js";
import seekerSchemas from "../validations/seeker.validation.js";
import FcmTokenController from '../controllers/app/FcmToken/FcmTokenController.js';

const router = express.Router();

router.get('/tokens', authUser, validate(seekerSchemas.listSchema), FcmTokenController.listTokens);
router.post('/tokens', authUser, express.json(), validate(seekerSchemas.fcmTokenRegisterSchema), FcmTokenController.registerToken);
router.post('/update-tokens/:id', authUser, express.json(), validate(seekerSchemas.fcmTokenUpdateSchema), FcmTokenController.updateToken);
router.post('/delete-tokens/:id', authUser, validate(seekerSchemas.legacyIdActionSchema), FcmTokenController.deleteToken);

export default router;
