import express from "express";
import campusController from "../controllers/app/campus/campusController.js";
import { requireCompanyPermission } from "../helper/companyDash/companyDashHelpers.js";
import multer from "../utils/multer.js";
import validate from "../middlewares/validate.js";
import companySchemas from "../validations/company.validation.js";

const router = express.Router();
const upload = multer;

router.get(
  "/overview",
  requireCompanyPermission("ats.view"),
  campusController.universityOverview,
);
router.get(
  "/opportunities",
  requireCompanyPermission("jobs.manage"),
  validate(companySchemas.listSchema),
  campusController.companyOpportunities,
);
router.post(
  "/opportunities",
  requireCompanyPermission("jobs.manage"),
  upload.none(),
  validate(companySchemas.bodySchema),
  campusController.createCompanyOpportunity,
);
router.get(
  "/students",
  requireCompanyPermission("ats.view"),
  validate(companySchemas.listSchema),
  campusController.students,
);
router.get(
  "/students/:employeeId",
  requireCompanyPermission("ats.view"),
  validate(companySchemas.campusStudentDetailSchema),
  campusController.companyStudentDetail,
);
router.get(
  "/partners",
  requireCompanyPermission("ats.view"),
  validate(companySchemas.listSchema),
  campusController.partners,
);
router.get(
  "/partners/:universityId",
  requireCompanyPermission("ats.view"),
  validate(companySchemas.campusPartnerDetailSchema),
  campusController.companyPartnerDetail,
);
router.post(
  "/partners",
  requireCompanyPermission("jobs.manage"),
  upload.none(),
  validate(companySchemas.bodySchema),
  campusController.addPartner,
);
router.patch(
  "/partners/:universityId/cancel-request",
  requireCompanyPermission("jobs.manage"),
  upload.none(),
  validate(companySchemas.campusPartnerCancelSchema),
  campusController.cancelCompanyPartnerRequest,
);

export default router;
