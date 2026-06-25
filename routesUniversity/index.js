import express from "express";
import { authUser } from "../middlewares/userAuth.js";
import campusController from "../controllers/app/campus/campusController.js";
import multer from "../utils/multer.js";

const router = express.Router();
const upload = multer;

router.get("/dashboard", authUser, campusController.userUniversityOverview);
router.get("/dashboard/overview", authUser, campusController.userUniversityOverview);
router.get("/overview", authUser, campusController.userUniversityOverview);

router.get("/students", authUser, campusController.userUniversityStudents);

router.get("/verifications", authUser, campusController.adminListVerifications);
router.post("/verifications/:id/approve", authUser, upload.none(), campusController.adminApproveVerification);
router.post("/verifications/:id/reject", authUser, upload.none(), campusController.adminRejectVerification);
router.post("/verifications/:id/request-info", authUser, upload.none(), campusController.adminRequestVerificationInfo);

router.get("/analytics/employability", authUser, campusController.userUniversityEmployabilityAnalytics);
router.get("/reports/outcomes", authUser, campusController.userUniversityOutcomeReport);

router.get("/partners", authUser, campusController.userUniversityPartners);
router.get("/employer-partners", authUser, campusController.userUniversityPartners);

router.get("/opportunities", authUser, campusController.userUniversityOpportunities);
router.post("/opportunities", authUser, upload.none(), campusController.createUniversityOpportunityRequest);

export default router;
