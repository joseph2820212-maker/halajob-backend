import express from "express";
import { authUser } from "../middlewares/userAuth.js";
import validate from "../middlewares/validate.js";
import seekerSchemas from "../validations/seeker.validation.js";
import CommunicationController from "../controllers/app/communication/CommunicationController.js";

const router = express.Router();

router.use(authUser);

router.get(
  "/preferences",
  validate(seekerSchemas.communicationPreferencesSchema),
  CommunicationController.getPreferences,
);
router.patch(
  "/preferences",
  express.json(),
  validate(seekerSchemas.communicationPreferencesSchema),
  CommunicationController.updatePreferences,
);
router.put(
  "/preferences",
  express.json(),
  validate(seekerSchemas.communicationPreferencesSchema),
  CommunicationController.updatePreferences,
);
router.post(
  "/manual-whatsapp-link",
  express.json(),
  validate(seekerSchemas.manualWhatsappLinkSchema),
  CommunicationController.createManualWhatsappLink,
);

export default router;
