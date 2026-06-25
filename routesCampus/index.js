import express from "express";
import { authUser } from "../middlewares/userAuth.js";
import campusController from "../controllers/app/campus/campusController.js";
import multer from "../utils/multer.js";

const router = express.Router();
const upload = multer;

router.get("/universities", campusController.listUniversities);
router.get("/universities/:id/campuses", campusController.listUniversityCampuses);

router.get("/student-verifications/me", authUser, campusController.studentVerificationStatus);
router.post("/student-verifications", authUser, upload.none(), campusController.startStudentVerification);
router.post("/student-verifications/:id/resubmit", authUser, upload.none(), campusController.resubmitStudentVerification);

router.post("/verification/start", authUser, upload.none(), campusController.startStudentVerification);
router.post("/verification/confirm-email", authUser, upload.none(), campusController.confirmStudentVerificationEmail);
router.post("/verification/upload-document", authUser, upload.single("document"), campusController.uploadStudentVerificationDocument);

router.get("/admin/verifications", authUser, campusController.adminListVerifications);
router.post("/admin/verifications/:id/approve", authUser, upload.none(), campusController.adminApproveVerification);
router.post("/admin/verifications/:id/reject", authUser, upload.none(), campusController.adminRejectVerification);
router.post("/admin/verifications/:id/request-info", authUser, upload.none(), campusController.adminRequestVerificationInfo);

export default router;
