import express from "express";
import { authUser } from "../middlewares/userAuth.js";
import { requireAppAccount } from "../middlewares/appAccountGuard.js";
import CvTranslationController from "../controllers/translations/CvTranslationController.js";
import multer from "../utils/multer.js";

const router = express.Router();
const upload = multer;

router.put(
  "/translations/:lang",
  authUser,
  requireAppAccount("employee"),
  upload.none(),
  CvTranslationController.saveCvTranslation
);

export default router;
