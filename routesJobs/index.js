import express from "express";
import { authUser } from "../middlewares/userAuth.js";
import { requireAppAccount } from "../middlewares/appAccountGuard.js";
import { requireCompanyPermission } from "../helper/companyDash/companyDashHelpers.js";
import JobTranslationController from "../controllers/translations/JobTranslationController.js";
import multer from "../utils/multer.js";
import validate from "../middlewares/validate.js";
import platformSchemas from "../validations/platform.validation.js";

const router = express.Router();
const upload = multer;

router.put(
  "/:jobId/translations/:lang",
  authUser,
  requireAppAccount("company"),
  requireCompanyPermission("jobs.manage"),
  upload.none(),
  validate(platformSchemas.jobTranslationSaveSchema),
  JobTranslationController.saveJobTranslation
);

router.get(
  "/:jobId/translations/:lang",
  authUser,
  requireAppAccount("company"),
  requireCompanyPermission("jobs.manage"),
  JobTranslationController.getJobTranslation
);

export default router;
