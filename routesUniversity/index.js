import express from "express";
import { authUser } from "../middlewares/userAuth.js";
import { requireUniversityAdminContext } from "../middlewares/appAccountGuard.js";
import campusController from "../controllers/app/campus/campusController.js";
import multer from "../utils/multer.js";

const router = express.Router();
const upload = multer;
const universityAdminGuard = [authUser, requireUniversityAdminContext];

router.get("/dashboard", universityAdminGuard, campusController.userUniversityOverview);
router.get("/dashboard/overview", universityAdminGuard, campusController.userUniversityOverview);
router.get("/overview", universityAdminGuard, campusController.userUniversityOverview);

router.get("/students", universityAdminGuard, campusController.userUniversityStudents);
router.get("/students/:studentId/career-passport", universityAdminGuard, campusController.userUniversityStudentCareerPassport);

router.get("/verifications", universityAdminGuard, campusController.adminListVerifications);
router.post("/verifications/:id/approve", universityAdminGuard, upload.none(), campusController.adminApproveVerification);
router.post("/verifications/:id/reject", universityAdminGuard, upload.none(), campusController.adminRejectVerification);
router.post("/verifications/:id/request-info", universityAdminGuard, upload.none(), campusController.adminRequestVerificationInfo);

router.get("/analytics/employability", universityAdminGuard, campusController.userUniversityEmployabilityAnalytics);
router.get("/reports/outcomes", universityAdminGuard, campusController.userUniversityOutcomeReport);

router.get("/partners", universityAdminGuard, campusController.userUniversityPartners);
router.get("/employer-partners", universityAdminGuard, campusController.userUniversityPartners);

router.get("/opportunities", universityAdminGuard, campusController.userUniversityOpportunities);
router.post("/opportunities", universityAdminGuard, upload.none(), campusController.createUniversityOpportunityRequest);

export default router;
