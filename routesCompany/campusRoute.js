import express from "express";
import campusController from "../controllers/app/campus/campusController.js";
import { requireCompanyPermission } from "../helper/companyDash/companyDashHelpers.js";
import multer from "../utils/multer.js";

const router = express.Router();
const upload = multer;

router.get("/overview", requireCompanyPermission("ats.view"), campusController.universityOverview);
router.get("/opportunities", requireCompanyPermission("jobs.manage"), campusController.companyOpportunities);
router.post("/opportunities", requireCompanyPermission("jobs.manage"), upload.none(), campusController.createCompanyOpportunity);
router.get("/students", requireCompanyPermission("ats.view"), campusController.students);
router.get("/partners", requireCompanyPermission("ats.view"), campusController.partners);
router.post("/partners", requireCompanyPermission("jobs.manage"), upload.none(), campusController.addPartner);

export default router;
