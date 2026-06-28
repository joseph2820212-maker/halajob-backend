import express from "express";
import { authUser } from "../middlewares/userAuth.js";
import { requireUniversityAdminContext, requireUniversityPermission } from "../middlewares/appAccountGuard.js";
import campusController from "../controllers/app/campus/campusController.js";
import multer from "../utils/multer.js";
import validate from "../middlewares/validate.js";
import platformSchemas from "../validations/platform.validation.js";

const router = express.Router();
const upload = multer;
const universityAdminGuard = [authUser, requireUniversityAdminContext];

router.get("/dashboard", universityAdminGuard, campusController.userUniversityOverview);
router.get("/dashboard/overview", universityAdminGuard, campusController.userUniversityOverview);
router.get("/overview", universityAdminGuard, campusController.userUniversityOverview);

router.get("/students", universityAdminGuard, campusController.userUniversityStudents);
router.get("/students/:studentId/career-passport", universityAdminGuard, campusController.userUniversityStudentCareerPassport);

router.get("/verifications", universityAdminGuard, campusController.adminListVerifications);
router.get("/verifications/:id/document", universityAdminGuard, campusController.adminDownloadStudentVerificationDocument);
router.post("/verifications/:id/approve", universityAdminGuard, upload.none(), validate(platformSchemas.campusAdminVerificationActionSchema), campusController.adminApproveVerification);
router.post("/verifications/:id/reject", universityAdminGuard, upload.none(), validate(platformSchemas.campusAdminVerificationActionSchema), campusController.adminRejectVerification);
router.post("/verifications/:id/request-info", universityAdminGuard, upload.none(), validate(platformSchemas.campusAdminVerificationActionSchema), campusController.adminRequestVerificationInfo);

router.get("/members", universityAdminGuard, requireUniversityPermission("campus.members.view"), validate(platformSchemas.campusListSchema), campusController.listUniversityMembers);
router.post("/members", universityAdminGuard, requireUniversityPermission("campus.members.manage"), upload.none(), validate(platformSchemas.universityMemberCreateSchema), campusController.upsertUniversityMember);
router.patch("/members/:memberId", universityAdminGuard, requireUniversityPermission("campus.members.manage"), upload.none(), validate(platformSchemas.universityMemberUpdateSchema), campusController.updateUniversityMember);
router.delete("/members/:memberId", universityAdminGuard, requireUniversityPermission("campus.members.manage"), validate(platformSchemas.universityMemberDeleteSchema), campusController.removeUniversityMember);

router.get("/analytics/employability", universityAdminGuard, campusController.userUniversityEmployabilityAnalytics);
router.get("/reports/outcomes", universityAdminGuard, campusController.userUniversityOutcomeReport);

router.get("/partners", universityAdminGuard, campusController.userUniversityPartners);
router.get("/employer-partners", universityAdminGuard, campusController.userUniversityPartners);

router.get("/opportunities", universityAdminGuard, validate(platformSchemas.campusListSchema), campusController.userUniversityOpportunities);
router.post("/opportunities", universityAdminGuard, upload.none(), validate(platformSchemas.universityOpportunityRequestSchema), campusController.createUniversityOpportunityRequest);

export default router;
