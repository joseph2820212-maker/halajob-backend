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

router.get("/universities", campusController.listUniversities);
router.get("/universities/:id/campuses", campusController.listUniversityCampuses);

router.get("/student-verifications/me", authUser, campusController.studentVerificationStatus);
router.post("/student-verifications", authUser, upload.none(), validate(platformSchemas.campusVerificationStartSchema), campusController.startStudentVerification);
router.post("/student-verifications/:id/resubmit", authUser, upload.none(), validate(platformSchemas.campusVerificationResubmitSchema), campusController.resubmitStudentVerification);
router.get("/student-verifications/:id/document", authUser, campusController.downloadStudentVerificationDocument);

router.post("/verification/start", authUser, upload.none(), validate(platformSchemas.campusVerificationStartSchema), campusController.startStudentVerification);
router.post("/verification/confirm-email", authUser, upload.none(), validate(platformSchemas.campusVerificationConfirmSchema), campusController.confirmStudentVerificationEmail);
router.post("/verification/upload-document", authUser, upload.single("document"), validate(platformSchemas.campusVerificationDocumentSchema), campusController.uploadStudentVerificationDocument);

router.get("/admin/verifications", universityAdminGuard, campusController.adminListVerifications);
router.get("/admin/verifications/:id/document", universityAdminGuard, campusController.adminDownloadStudentVerificationDocument);
router.post("/admin/verifications/:id/approve", universityAdminGuard, upload.none(), validate(platformSchemas.campusAdminVerificationActionSchema), campusController.adminApproveVerification);
router.post("/admin/verifications/:id/reject", universityAdminGuard, upload.none(), validate(platformSchemas.campusAdminVerificationActionSchema), campusController.adminRejectVerification);
router.post("/admin/verifications/:id/request-info", universityAdminGuard, upload.none(), validate(platformSchemas.campusAdminVerificationActionSchema), campusController.adminRequestVerificationInfo);

router.get("/admin/members", universityAdminGuard, requireUniversityPermission("campus.members.view"), validate(platformSchemas.campusListSchema), campusController.listUniversityMembers);
router.post("/admin/members", universityAdminGuard, requireUniversityPermission("campus.members.manage"), upload.none(), validate(platformSchemas.universityMemberCreateSchema), campusController.upsertUniversityMember);
router.patch("/admin/members/:memberId", universityAdminGuard, requireUniversityPermission("campus.members.manage"), upload.none(), validate(platformSchemas.universityMemberUpdateSchema), campusController.updateUniversityMember);
router.delete("/admin/members/:memberId", universityAdminGuard, requireUniversityPermission("campus.members.manage"), validate(platformSchemas.universityMemberDeleteSchema), campusController.removeUniversityMember);

export default router;
