import express from "express";
import campusController from "../controllers/app/campus/campusController.js";
import { requireCompanyPermission } from "../helper/companyDash/companyDashHelpers.js";
import multer from "../utils/multer.js";
import validate from "../middlewares/validate.js";
import companySchemas from "../validations/company.validation.js";

const router = express.Router();
const upload = multer;

router.get("/overview", requireCompanyPermission("ats.view"), campusController.universityOverview);
router.get("/opportunities", requireCompanyPermission("jobs.manage"), validate(companySchemas.listSchema), campusController.companyOpportunities);
router.post("/opportunities", requireCompanyPermission("jobs.manage"), upload.none(), validate(companySchemas.bodySchema), campusController.createCompanyOpportunity);
router.get("/students", requireCompanyPermission("ats.view"), campusController.students);
router.get("/partners", requireCompanyPermission("ats.view"), validate(companySchemas.listSchema), campusController.partners);
router.post("/partners", requireCompanyPermission("jobs.manage"), upload.none(), validate(companySchemas.bodySchema), campusController.addPartner);

export default router;
