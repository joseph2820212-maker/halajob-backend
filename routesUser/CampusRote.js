import express from "express";
import { authUser } from "../middlewares/userAuth.js";
import { requireAppAccount, requireUniversityAdminContext } from "../middlewares/appAccountGuard.js";
import campusController from "../controllers/app/campus/campusController.js";
import campusMobileController from "../controllers/app/campus/campusMobileController.js";
import ApplyingJobController from "../controllers/app/JobData/ApplyingJobController.js";
import multer from "../utils/multer.js";
import validate from "../middlewares/validate.js";
import platformSchemas from "../validations/platform.validation.js";

const router = express.Router();
const upload = multer;
const campusMobileGuard = [authUser, requireAppAccount("employee"), campusMobileController.requireCampusStudent];
const universityAdminGuard = [authUser, requireUniversityAdminContext];

router.get("/universities", campusController.listUniversities);
router.get("/universities/:id/campuses", campusController.listUniversityCampuses);
router.get("/student-verifications/me", authUser, campusController.studentVerificationStatus);
router.post("/student-verifications", authUser, upload.none(), validate(platformSchemas.campusVerificationStartSchema), campusController.startStudentVerification);
router.post("/student-verifications/:id/resubmit", authUser, upload.none(), validate(platformSchemas.campusVerificationResubmitSchema), campusController.resubmitStudentVerification);
router.post("/verification/start", authUser, upload.none(), validate(platformSchemas.campusVerificationStartSchema), campusController.startStudentVerification);
router.post("/verification/confirm-email", authUser, upload.none(), validate(platformSchemas.campusVerificationConfirmSchema), campusController.confirmStudentVerificationEmail);
router.post("/verification/upload-document", authUser, upload.single("document"), validate(platformSchemas.campusVerificationDocumentSchema), campusController.uploadStudentVerificationDocument);
router.get("/admin/verifications", universityAdminGuard, campusController.adminListVerifications);
router.post("/admin/verifications/:id/approve", universityAdminGuard, upload.none(), validate(platformSchemas.campusAdminVerificationActionSchema), campusController.adminApproveVerification);
router.post("/admin/verifications/:id/reject", universityAdminGuard, upload.none(), validate(platformSchemas.campusAdminVerificationActionSchema), campusController.adminRejectVerification);
router.post("/admin/verifications/:id/request-info", universityAdminGuard, upload.none(), validate(platformSchemas.campusAdminVerificationActionSchema), campusController.adminRequestVerificationInfo);

router.get("/dashboard", campusMobileGuard, campusMobileController.dashboard);
router.get("/dashboard/overview", campusMobileGuard, campusMobileController.dashboard);
router.get("/content", campusMobileGuard, campusMobileController.content);
router.get("/events", campusMobileGuard, campusMobileController.events);

router.get("/opportunities", campusMobileGuard, campusMobileController.opportunities);
router.get("/opportunities/:id/readiness", campusMobileGuard, campusMobileController.requireCampusOpportunity, ApplyingJobController.getApplyReadiness);
router.get("/opportunities/:id", campusMobileGuard, campusMobileController.opportunityDetails);
router.post("/opportunities/:id/apply", campusMobileGuard, campusMobileController.requireCampusOpportunity, upload.none(), validate(platformSchemas.campusIdActionSchema), ApplyingJobController.applyJob);
router.post("/opportunities/:id/apply-external", campusMobileGuard, campusMobileController.requireCampusOpportunity, upload.none(), validate(platformSchemas.campusIdActionSchema), campusMobileController.applyExternalOpportunity);
router.post("/opportunities/:id/save", campusMobileGuard, upload.none(), validate(platformSchemas.campusIdActionSchema), campusMobileController.saveOpportunity);
router.delete("/opportunities/:id/save", campusMobileGuard, validate(platformSchemas.campusIdActionSchema), campusMobileController.unsaveOpportunity);
router.post("/opportunities/:id/toggle-save", campusMobileGuard, upload.none(), validate(platformSchemas.campusIdActionSchema), campusMobileController.toggleSaveOpportunity);

router.get("/applications", campusMobileGuard, campusMobileController.applications);
router.get("/applications/:id", campusMobileGuard, campusMobileController.applicationDetails);
router.post("/applications/:id/messages", campusMobileGuard, upload.none(), validate(platformSchemas.campusApplicationMessageSchema), campusMobileController.sendApplicationMessage);
router.patch("/applications/:id/cancel", campusMobileGuard, upload.none(), validate(platformSchemas.campusIdActionSchema), campusMobileController.cancelApplication);
router.post("/applications/:id/cancel", campusMobileGuard, upload.none(), validate(platformSchemas.campusIdActionSchema), campusMobileController.cancelApplication);

router.get("/resources", campusMobileGuard, campusController.resources);
router.get("/overview", campusMobileGuard, campusController.overview);
router.get("/profile", campusMobileGuard, validate(platformSchemas.campusProfileSchema), campusController.profile);
router.post("/profile", campusMobileGuard, upload.none(), validate(platformSchemas.campusProfileSchema), campusController.updateProfile);
router.put("/profile", campusMobileGuard, upload.none(), validate(platformSchemas.campusProfileSchema), campusController.updateProfile);
router.patch("/profile", campusMobileGuard, upload.none(), validate(platformSchemas.campusProfileSchema), campusController.updateProfile);
router.post("/events/:eventId/register", campusMobileGuard, upload.none(), validate(platformSchemas.campusEventActionSchema), campusController.registerEvent);
router.patch("/events/:eventId/cancel", campusMobileGuard, upload.none(), validate(platformSchemas.campusEventActionSchema), campusMobileController.cancelEventRegistration);
router.post("/events/:eventId/cancel", campusMobileGuard, upload.none(), validate(platformSchemas.campusEventActionSchema), campusMobileController.cancelEventRegistration);
router.get("/university/overview", universityAdminGuard, campusController.userUniversityOverview);
router.get("/university/opportunities", universityAdminGuard, validate(platformSchemas.campusListSchema), campusController.userUniversityOpportunities);
router.post("/university/opportunities", universityAdminGuard, upload.none(), validate(platformSchemas.universityOpportunityRequestSchema), campusController.createUniversityOpportunityRequest);
router.get("/university/students", universityAdminGuard, campusController.userUniversityStudents);
router.get("/university/partners", universityAdminGuard, campusController.userUniversityPartners);

export default router;
