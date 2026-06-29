import express from "express";
import { authUser } from "../middlewares/userAuth.js";
import validate from "../middlewares/validate.js";
import platformSchemas from "../validations/platform.validation.js";
import SettingsCenterController from "../controllers/settings/SettingsCenterController.js";

const router = express.Router();

router.get(
  "/",
  authUser,
  validate(platformSchemas.settingsUpdateSchema),
  SettingsCenterController.getUserSettings,
);
router.put(
  "/",
  authUser,
  validate(platformSchemas.settingsUpdateSchema),
  SettingsCenterController.updateUserSettings,
);
router.patch(
  "/",
  authUser,
  validate(platformSchemas.settingsUpdateSchema),
  SettingsCenterController.updateUserSettings,
);

export default router;
