import express from "express";
import { authUser } from "../middlewares/userAuth.js";
import { requireAppAccount } from "../middlewares/appAccountGuard.js";
import validate from "../middlewares/validate.js";
import seekerSchemas from "../validations/seeker.validation.js";
import CvTranslationController from "../controllers/translations/CvTranslationController.js";
import multer from "../utils/multer.js";

const router = express.Router();
const upload = multer;

router.put(
  "/translations/:lang",
  authUser,
  requireAppAccount("employee"),
  upload.none(),
  validate(seekerSchemas.cvTranslationSaveSchema),
  CvTranslationController.saveCvTranslation
);

router.get(
  "/translations/:lang",
  authUser,
  requireAppAccount("employee"),
  CvTranslationController.getCvTranslation
);

export default router;
