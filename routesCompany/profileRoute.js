import express from "express";
import controller from "../controllers/companyDash/companyPublicProfileController.js";
import { requireCompanyPermission } from "../helper/companyDash/companyDashHelpers.js";
import validate from "../middlewares/validate.js";
import companySchemas from "../validations/company.validation.js";
import multer from "../utils/multer.js";

const upload = multer;
const router = express.Router();

router.get("/public", requireCompanyPermission("company.profile.manage"), validate(companySchemas.listSchema), controller.getPublicProfile);
router.patch("/public", requireCompanyPermission("company.profile.manage"), upload.none(), validate(companySchemas.companyPublicProfileSchema), controller.updatePublicProfile);
router.post("/public/submit-review", requireCompanyPermission("company.profile.manage"), upload.none(), validate(companySchemas.bodySchema), controller.submitPublicProfileReview);
router.post("/public/preview", requireCompanyPermission("company.profile.manage"), upload.none(), validate(companySchemas.companyPublicProfileSchema), controller.previewPublicProfile);

export default router;
