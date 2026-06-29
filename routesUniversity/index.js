import express from "express";
import { authUser } from "../middlewares/userAuth.js";
import {
  requireUniversityAdminContext,
  requireUniversityPermission,
} from "../middlewares/appAccountGuard.js";
import campusController from "../controllers/app/campus/campusController.js";
import multer from "../utils/multer.js";
import validate from "../middlewares/validate.js";
import platformSchemas from "../validations/platform.validation.js";
import SettingsCenterController from "../controllers/settings/SettingsCenterController.js";
import * as UniversityResourceController from "../controllers/university/resources/UniversityResourceController.js";
import resourceSchemas from "../validations/resource.validation.js";

const router = express.Router();
const upload = multer;
const universityAdminGuard = [authUser, requireUniversityAdminContext];

router.get(
  "/dashboard",
  universityAdminGuard,
  campusController.userUniversityOverview,
);
router.get(
  "/dashboard/overview",
  universityAdminGuard,
  campusController.userUniversityOverview,
);
router.get(
  "/overview",
  universityAdminGuard,
  campusController.userUniversityOverview,
);
router.get(
  "/settings",
  universityAdminGuard,
  validate(platformSchemas.settingsUpdateSchema),
  SettingsCenterController.getUniversitySettings,
);
router.put(
  "/settings",
  universityAdminGuard,
  validate(platformSchemas.settingsUpdateSchema),
  SettingsCenterController.updateUniversitySettings,
);
router.patch(
  "/settings",
  universityAdminGuard,
  validate(platformSchemas.settingsUpdateSchema),
  SettingsCenterController.updateUniversitySettings,
);

router.get(
  "/resources",
  universityAdminGuard,
  requireUniversityPermission("campus.resources.view"),
  validate(resourceSchemas.resourceListSchema),
  UniversityResourceController.listUniversityResources,
);
router.post(
  "/resources",
  universityAdminGuard,
  requireUniversityPermission("campus.resources.manage"),
  upload.none(),
  validate(resourceSchemas.learningResourceCreateSchema),
  UniversityResourceController.createUniversityResource,
);
router.get(
  "/resources/analytics",
  universityAdminGuard,
  requireUniversityPermission("campus.resources.view"),
  validate(resourceSchemas.resourceListSchema),
  UniversityResourceController.universityResourceAnalytics,
);
router.post(
  "/resources/:id/assign",
  universityAdminGuard,
  requireUniversityPermission("campus.resources.manage"),
  upload.none(),
  validate(resourceSchemas.universityResourceAssignSchema),
  UniversityResourceController.assignUniversityResource,
);
router.patch(
  "/resources/:id",
  universityAdminGuard,
  requireUniversityPermission("campus.resources.manage"),
  upload.none(),
  validate(resourceSchemas.learningResourceUpdateSchema),
  UniversityResourceController.updateUniversityResource,
);
router.delete(
  "/resources/:id",
  universityAdminGuard,
  requireUniversityPermission("campus.resources.manage"),
  validate(resourceSchemas.learningResourceDeleteSchema),
  UniversityResourceController.deleteUniversityResource,
);

router.get(
  "/students",
  universityAdminGuard,
  campusController.userUniversityStudents,
);
router.get(
  "/students/:studentId",
  universityAdminGuard,
  validate(platformSchemas.universityStudentDetailSchema),
  campusController.userUniversityStudentDetail,
);
router.get(
  "/students/:studentId/career-passport",
  universityAdminGuard,
  validate(platformSchemas.universityStudentDetailSchema),
  campusController.userUniversityStudentCareerPassport,
);

router.get(
  "/verifications",
  universityAdminGuard,
  campusController.adminListVerifications,
);
router.get(
  "/verifications/:id/document",
  universityAdminGuard,
  campusController.adminDownloadStudentVerificationDocument,
);
router.post(
  "/verifications/:id/approve",
  universityAdminGuard,
  upload.none(),
  validate(platformSchemas.campusAdminVerificationActionSchema),
  campusController.adminApproveVerification,
);
router.post(
  "/verifications/:id/reject",
  universityAdminGuard,
  upload.none(),
  validate(platformSchemas.campusAdminVerificationActionSchema),
  campusController.adminRejectVerification,
);
router.post(
  "/verifications/:id/request-info",
  universityAdminGuard,
  upload.none(),
  validate(platformSchemas.campusAdminVerificationActionSchema),
  campusController.adminRequestVerificationInfo,
);

router.get(
  "/members",
  universityAdminGuard,
  requireUniversityPermission("campus.members.view"),
  validate(platformSchemas.campusListSchema),
  campusController.listUniversityMembers,
);
router.post(
  "/members",
  universityAdminGuard,
  requireUniversityPermission("campus.members.manage"),
  upload.none(),
  validate(platformSchemas.universityMemberCreateSchema),
  campusController.upsertUniversityMember,
);
router.patch(
  "/members/:memberId",
  universityAdminGuard,
  requireUniversityPermission("campus.members.manage"),
  upload.none(),
  validate(platformSchemas.universityMemberUpdateSchema),
  campusController.updateUniversityMember,
);
router.delete(
  "/members/:memberId",
  universityAdminGuard,
  requireUniversityPermission("campus.members.manage"),
  validate(platformSchemas.universityMemberDeleteSchema),
  campusController.removeUniversityMember,
);

router.get(
  "/analytics/employability",
  universityAdminGuard,
  campusController.userUniversityEmployabilityAnalytics,
);
router.get(
  "/analytics/readiness",
  universityAdminGuard,
  campusController.userUniversityEmployabilityAnalytics,
);
router.get(
  "/analytics/resources",
  universityAdminGuard,
  requireUniversityPermission("campus.resources.view"),
  validate(resourceSchemas.resourceListSchema),
  UniversityResourceController.universityResourceAnalytics,
);
router.get(
  "/analytics/outcomes",
  universityAdminGuard,
  campusController.userUniversityOutcomeReport,
);
router.get(
  "/reports/outcomes",
  universityAdminGuard,
  campusController.userUniversityOutcomeReport,
);

router.get(
  "/partners",
  universityAdminGuard,
  campusController.userUniversityPartners,
);
router.patch(
  "/partners/:partnerId/approve",
  universityAdminGuard,
  upload.none(),
  validate(platformSchemas.universityPartnerActionSchema),
  campusController.approveUniversityPartner,
);
router.patch(
  "/partners/:partnerId/reject",
  universityAdminGuard,
  upload.none(),
  validate(platformSchemas.universityPartnerActionSchema),
  campusController.rejectUniversityPartner,
);
router.patch(
  "/partners/:partnerId/suspend",
  universityAdminGuard,
  upload.none(),
  validate(platformSchemas.universityPartnerActionSchema),
  campusController.suspendUniversityPartner,
);
router.get(
  "/employer-partners",
  universityAdminGuard,
  campusController.userUniversityPartners,
);

router.get(
  "/opportunities",
  universityAdminGuard,
  validate(platformSchemas.campusListSchema),
  campusController.userUniversityOpportunities,
);
router.post(
  "/opportunities",
  universityAdminGuard,
  upload.none(),
  validate(platformSchemas.universityOpportunityRequestSchema),
  campusController.createUniversityOpportunityRequest,
);

export default router;
