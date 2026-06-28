import express from "express";
import { authUser } from "../middlewares/userAuth.js";
import { optionalAuthUser } from "../middlewares/optionalAuthUser.js";
import validate from "../middlewares/validate.js";
import schemas from "../validations/userContent.validation.js";
import PrivacyRequestController from "../controllers/app/Me/PrivacyRequestController.js";

const router = express.Router();

router.post("/requests", authUser, express.json(), validate(schemas.privacyRequestSchema), PrivacyRequestController.createPrivacyRequest);
router.get("/requests", authUser, PrivacyRequestController.listMyPrivacyRequests);
router.get("/consents", authUser, PrivacyRequestController.listConsents);
router.post("/consents/:purpose", authUser, express.json(), validate(schemas.setConsentSchema), PrivacyRequestController.setConsent);
router.post("/consents/:pageKey/acknowledge", authUser, express.json(), validate(schemas.acknowledgePolicySchema), PrivacyRequestController.acknowledgePolicy);
router.post("/accessibility", optionalAuthUser, express.json(), validate(schemas.accessibilityRequestSchema), PrivacyRequestController.createAccessibilityRequest);

export default router;
