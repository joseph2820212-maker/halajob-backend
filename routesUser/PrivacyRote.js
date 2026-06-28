import express from "express";
import { authUser } from "../middlewares/userAuth.js";
import { optionalAuthUser } from "../middlewares/optionalAuthUser.js";
import PrivacyRequestController from "../controllers/app/Me/PrivacyRequestController.js";

const router = express.Router();

router.post("/requests", authUser, express.json(), PrivacyRequestController.createPrivacyRequest);
router.get("/requests", authUser, PrivacyRequestController.listMyPrivacyRequests);
router.get("/consents", authUser, PrivacyRequestController.listConsents);
router.post("/consents/:purpose", authUser, express.json(), PrivacyRequestController.setConsent);
router.post("/consents/:pageKey/acknowledge", authUser, express.json(), PrivacyRequestController.acknowledgePolicy);
router.post("/accessibility", optionalAuthUser, express.json(), PrivacyRequestController.createAccessibilityRequest);

export default router;
