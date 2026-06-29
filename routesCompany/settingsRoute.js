import express from "express";
import validate from "../middlewares/validate.js";
import platformSchemas from "../validations/platform.validation.js";
import SettingsCenterController from "../controllers/settings/SettingsCenterController.js";

const router = express.Router();

router.get(
  "/",
  validate(platformSchemas.settingsUpdateSchema),
  SettingsCenterController.getCompanySettings,
);
router.put(
  "/",
  validate(platformSchemas.settingsUpdateSchema),
  SettingsCenterController.updateCompanySettings,
);
router.patch(
  "/",
  validate(platformSchemas.settingsUpdateSchema),
  SettingsCenterController.updateCompanySettings,
);

export default router;
