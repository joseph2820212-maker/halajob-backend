import express from "express";
import fs from "fs";
import path from "path";

import authRoute from "./authRoute.js";
import exselRoute from "./exselRoute.js";
import keywordRoute from "./keywordRoute.js";
import dashboardRoute from "./DashboardRoute.js";
import dashboardController from "../controllers/dash/adminDashboardController.js";
import adminModerationController from "../controllers/dash/adminModerationController.js";
import adminNotificationController from "../controllers/dash/adminNotificationController.js";
import CommunicationAdminController from "../controllers/dash/CommunicationAdminController.js";
import adminOperationsController from "../controllers/dash/adminOperationsController.js";
import SalaryInsightsController from "../controllers/salaryInsights/SalaryInsightsController.js";
import adminSearchController from "../controllers/dash/adminSearchController.js";
import adminSupportController from "../controllers/dash/adminSupportController.js";
import resourceController from "../controllers/dash/adminResourceController.js";
import CompanyPublicProfileAdminController from "../controllers/dash/CompanyPublicProfileAdminController.js";
import * as LearningResourceAdminController from "../controllers/dash/LearningResourceAdminController.js";
import * as InterviewPrepAdminController from "../controllers/dash/InterviewPrepAdminController.js";
import TrustAdminController from "../controllers/trust/TrustAdminController.js";
import AiAdminController from "../controllers/ai/AiAdminController.js";
import campusController from "../controllers/app/campus/campusController.js";
import SettingsCenterController from "../controllers/settings/SettingsCenterController.js";
import cvRoute from "./cvRoute.js";
import { createDashResourceRouter } from "./dashResourceRouteFactory.js";
import multer from "../utils/multer.js";
import { isAdmin } from "../middlewares/isAdmin.js";
import {
  checkPermission,
  checkResourcePermission,
} from "../middlewares/checkPermission.js";
import validate from "../middlewares/validate.js";
import adminSchemas from "../validations/admin.validation.js";
import resourceSchemas from "../validations/resource.validation.js";
import interviewPrepSchemas from "../validations/interviewPrep.validation.js";

const FILES_DIRECTORY = path.resolve(
  process.env.FILES_DIRECTORY || "./uploads",
);
const router = express.Router();
const upload = multer;
const can = checkPermission;

const PUBLIC_IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".svg",
]);
const DOCUMENT_EXTENSIONS = new Set([".pdf"]);

const sendDashboardFile =
  ({ allowDocuments = false } = {}) =>
  (req, res) => {
    const fileName = req.params.name;

    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");

    if (
      !fileName ||
      fileName.includes("..") ||
      fileName.includes("/") ||
      fileName.includes("\\")
    ) {
      return res
        .status(400)
        .json({ status: false, message: "invalid_file_name" });
    }

    const extension = path.extname(fileName).toLowerCase();
    const isDocument = DOCUMENT_EXTENSIONS.has(extension);
    const isPublicImage = PUBLIC_IMAGE_EXTENSIONS.has(extension);

    if ((isDocument && !allowDocuments) || (!isDocument && !isPublicImage)) {
      return res
        .status(403)
        .json({ status: false, message: "file_access_forbidden" });
    }

    res.setHeader("X-Content-Type-Options", "nosniff");
    if (isDocument) {
      res.setHeader("Cache-Control", "no-store");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${path.basename(fileName).replace(/["\\]/g, "_")}"`,
      );
    }
    if (extension === ".svg") {
      res.setHeader(
        "Content-Security-Policy",
        "default-src 'none'; img-src data:; style-src 'unsafe-inline'",
      );
    }

    const baseDirectory = isDocument
      ? path.join(FILES_DIRECTORY, "files")
      : FILES_DIRECTORY;
    const filePath = path.resolve(baseDirectory, fileName);

    if (!filePath.startsWith(path.resolve(baseDirectory) + path.sep)) {
      return res
        .status(400)
        .json({ status: false, message: "invalid_file_name" });
    }

    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (err)
        return res
          .status(404)
          .json({ status: false, message: "file_not_found" });
      return res.sendFile(filePath, (sendErr) => {
        if (sendErr && !res.headersSent) {
          return res
            .status(500)
            .json({ status: false, message: "failed_to_send_file" });
        }
        return undefined;
      });
    });
  };

/* ----------------------------- Public dashboard auth/files ----------------------------- */
router.use("/auth", authRoute);
router.get("/image/:name", sendDashboardFile());
router.get("/image/uploads/:name", sendDashboardFile());

/* ----------------------------- Protected dashboard area ----------------------------- */
router.use(isAdmin);

router.get(
  "/file/:name",
  can("files.read"),
  sendDashboardFile({ allowDocuments: true }),
);

router.use("/dashboard", can("dashboard.view"), dashboardRoute);
router.use("/statistics", can("dashboard.view"), dashboardRoute);
router.use("/project_status/global", can("dashboard.view"), dashboardRoute);
router.get("/tracking", can("dashboard.view"), dashboardController.tracking);
router.get("/activity", can("dashboard.view"), dashboardController.tracking);
router.get(
  "/search/global",
  can("dashboard.search"),
  adminSearchController.globalSearch,
);
router.get(
  "/global-search",
  can("dashboard.search"),
  adminSearchController.globalSearch,
);

/* ----------------------------- Company public profile moderation ----------------------------- */
router.get(
  "/company-public-profiles/pending",
  can(["companies.moderate", "dashboard.view"]),
  validate(adminSchemas.companyPublicProfileListSchema),
  CompanyPublicProfileAdminController.listPending,
);
router.post(
  "/company-public-profiles/:companyId/approve",
  can("companies.moderate"),
  upload.none(),
  validate(adminSchemas.companyPublicProfileActionSchema),
  CompanyPublicProfileAdminController.approve,
);
router.post(
  "/company-public-profiles/:companyId/reject",
  can("companies.moderate"),
  upload.none(),
  validate(adminSchemas.companyPublicProfileActionSchema),
  CompanyPublicProfileAdminController.reject,
);

/* ----------------------------- Platform settings ----------------------------- */
router.get(
  "/platform/settings",
  can(["settings.view", "settings.manage"]),
  validate(adminSchemas.platformSettingsSchema),
  SettingsCenterController.getPlatformSettings,
);
router.get(
  "/platform/settings/schema",
  can(["settings.view", "settings.manage"]),
  validate(adminSchemas.platformSettingsSchema),
  SettingsCenterController.getPlatformSettingsSchema,
);
router.put(
  "/platform/settings",
  can("settings.manage"),
  validate(adminSchemas.platformSettingsSchema),
  SettingsCenterController.updatePlatformSettings,
);
router.patch(
  "/platform/settings",
  can("settings.manage"),
  validate(adminSchemas.platformSettingsSchema),
  SettingsCenterController.updatePlatformSettings,
);

/* ----------------------------- AI administration ----------------------------- */
router.get("/ai/features", can("ai.view"), AiAdminController.listFeatures);
router.get(
  "/ai/limits",
  can("ai.view"),
  validate(adminSchemas.listResourceSchema),
  AiAdminController.listLimits,
);
router.post(
  "/ai/limits",
  can("ai.manage"),
  upload.none(),
  validate(adminSchemas.aiLimitCreateSchema),
  AiAdminController.upsertLimit,
);
router.patch(
  "/ai/limits/:id",
  can("ai.manage"),
  upload.none(),
  validate(adminSchemas.aiLimitUpdateSchema),
  AiAdminController.updateLimit,
);
router.delete(
  "/ai/limits/:id",
  can("ai.manage"),
  validate(adminSchemas.idOnlySchema),
  AiAdminController.deactivateLimit,
);
router.get("/ai/requests", can("ai.view"), AiAdminController.listRequests);
router.get("/ai/requests/:id", can("ai.view"), AiAdminController.getRequest);
router.get("/ai/summary", can("ai.view"), AiAdminController.summary);
router.get("/ai/usage/summary", can("ai.view"), AiAdminController.summary);

/* ----------------------------- Operations logs / review readers ----------------------------- */
router.get(
  "/audit-logs",
  can("audit.view"),
  adminOperationsController.listAuditLogs,
);
router.get(
  "/operations/audit-logs",
  can("audit.view"),
  adminOperationsController.listAuditLogs,
);
router.get(
  "/translations",
  can("translations.view"),
  adminOperationsController.listTranslations,
);
router.get(
  "/translation-logs",
  can("translations.view"),
  adminOperationsController.listTranslations,
);
router.get(
  "/notifications/logs",
  can("notifications.view"),
  adminOperationsController.listNotificationLogs,
);
router.get(
  "/notification-logs",
  can("notifications.view"),
  adminOperationsController.listNotificationLogs,
);
router.get(
  "/invoices",
  can("subscriptions.manage"),
  adminOperationsController.listInvoices,
);
router.get(
  "/invoices/:invoiceId",
  can("subscriptions.manage"),
  adminOperationsController.getInvoice,
);
router.get(
  "/billing/invoices",
  can("subscriptions.manage"),
  adminOperationsController.listInvoices,
);
router.get(
  "/billing/invoices/:invoiceId",
  can("subscriptions.manage"),
  adminOperationsController.getInvoice,
);
router.post(
  "/notifications/send",
  can("notifications.manage"),
  upload.none(),
  validate(adminSchemas.adminNotificationSendSchema),
  adminNotificationController.sendNotification,
);
router.post(
  "/notification/send",
  can("notifications.manage"),
  upload.none(),
  validate(adminSchemas.adminNotificationSendSchema),
  adminNotificationController.sendNotification,
);
router.post(
  "/operations/notifications/send",
  can("notifications.manage"),
  upload.none(),
  validate(adminSchemas.adminNotificationSendSchema),
  adminNotificationController.sendNotification,
);
router.get(
  "/communication/logs",
  can("notifications.view"),
  validate(adminSchemas.communicationLogListSchema),
  CommunicationAdminController.listDeliveryLogs,
);
router.get(
  "/communication/templates",
  can("notifications.view"),
  validate(adminSchemas.communicationTemplateListSchema),
  CommunicationAdminController.listTemplates,
);
router.post(
  "/communication/templates",
  can("notifications.manage"),
  upload.none(),
  validate(adminSchemas.communicationTemplateCreateSchema),
  CommunicationAdminController.createTemplate,
);
router.patch(
  "/communication/templates/:id",
  can("notifications.manage"),
  upload.none(),
  validate(adminSchemas.communicationTemplateUpdateSchema),
  CommunicationAdminController.updateTemplate,
);
router.post(
  "/communication/test-send",
  can("notifications.manage"),
  upload.none(),
  validate(adminSchemas.communicationTestSendSchema),
  CommunicationAdminController.testSend,
);
router.get(
  "/salary-insights",
  can(["dashboard.view", "jobs.view"]),
  validate(adminSchemas.salaryInsightListSchema),
  SalaryInsightsController.adminList,
);
router.post(
  "/salary-insights/rebuild",
  can(["jobs.manage", "dashboard.manage"]),
  upload.none(),
  validate(adminSchemas.salaryInsightRebuildSchema),
  SalaryInsightsController.adminRebuild,
);
router.get(
  "/salary-insights/health",
  can(["dashboard.view", "jobs.view"]),
  validate(adminSchemas.salaryInsightListSchema),
  SalaryInsightsController.adminHealth,
);

router.get(
  "/support-tickets",
  can(["support.view", "support.manage"]),
  adminSupportController.listTickets,
);
router.get(
  "/operations/support-tickets",
  can(["support.view", "support.manage"]),
  adminSupportController.listTickets,
);
router.get(
  "/support-tickets/:ticketId",
  can(["support.view", "support.manage"]),
  adminSupportController.getTicketDetails,
);
router.get(
  "/operations/support-tickets/:ticketId",
  can(["support.view", "support.manage"]),
  adminSupportController.getTicketDetails,
);
router.patch(
  "/support-tickets/:ticketId/status",
  can("support.manage"),
  upload.none(),
  validate(adminSchemas.supportTicketStatusSchema),
  adminSupportController.updateTicketStatus,
);
router.patch(
  "/operations/support-tickets/:ticketId/status",
  can("support.manage"),
  upload.none(),
  validate(adminSchemas.supportTicketStatusSchema),
  adminSupportController.updateTicketStatus,
);
router.post(
  "/support-tickets/:ticketId/messages",
  can("support.manage"),
  upload.none(),
  validate(adminSchemas.supportTicketMessageSchema),
  adminSupportController.addAdminMessage,
);
router.post(
  "/operations/support-tickets/:ticketId/messages",
  can("support.manage"),
  upload.none(),
  validate(adminSchemas.supportTicketMessageSchema),
  adminSupportController.addAdminMessage,
);

/* ----------------------------- Moderation / operations queues ----------------------------- */
router.get(
  "/moderation/company-requests",
  can("companies.moderate"),
  adminModerationController.listCompanyRequests,
);
router.get(
  "/company-requests",
  can("companies.moderate"),
  adminModerationController.listCompanyRequests,
);
router.post(
  "/company-requests/:id/approve",
  can("companies.moderate"),
  upload.none(),
  validate(adminSchemas.companyApprovalSchema),
  adminModerationController.approveCompanyRequest,
);
router.post(
  "/company-requests/:id/reject",
  can("companies.moderate"),
  upload.none(),
  validate(adminSchemas.companyRejectSchema),
  adminModerationController.rejectCompanyRequest,
);
router.patch(
  "/company-requests/:id/approve",
  can("companies.moderate"),
  upload.none(),
  validate(adminSchemas.companyApprovalSchema),
  adminModerationController.approveCompanyRequest,
);
router.patch(
  "/company-requests/:id/reject",
  can("companies.moderate"),
  upload.none(),
  validate(adminSchemas.companyRejectSchema),
  adminModerationController.rejectCompanyRequest,
);

router.get(
  "/moderation/jobs",
  can("jobs.moderate"),
  adminModerationController.listJobReviewQueue,
);
router.get(
  "/job-approvals",
  can("jobs.moderate"),
  adminModerationController.listJobReviewQueue,
);
router.post(
  "/jobs/:id/approve",
  can("jobs.moderate"),
  upload.none(),
  validate(adminSchemas.jobApprovalSchema),
  adminModerationController.approveJob,
);
router.post(
  "/jobs/:id/reject",
  can("jobs.moderate"),
  upload.none(),
  validate(adminSchemas.jobRejectSchema),
  adminModerationController.rejectJob,
);
router.patch(
  "/jobs/:id/approve",
  can("jobs.moderate"),
  upload.none(),
  validate(adminSchemas.jobApprovalSchema),
  adminModerationController.approveJob,
);
router.patch(
  "/jobs/:id/reject",
  can("jobs.moderate"),
  upload.none(),
  validate(adminSchemas.jobRejectSchema),
  adminModerationController.rejectJob,
);

router.get(
  "/trust/review-queue",
  can("trust.view"),
  TrustAdminController.reviewQueue,
);
router.post(
  "/trust/jobs/:jobId/mark-safe",
  can("trust.manage"),
  upload.none(),
  validate(adminSchemas.trustJobActionSchema),
  TrustAdminController.markJobSafe,
);
router.patch(
  "/trust/jobs/:jobId/mark-safe",
  can("trust.manage"),
  upload.none(),
  validate(adminSchemas.trustJobActionSchema),
  TrustAdminController.markJobSafe,
);
router.post(
  "/trust/jobs/:jobId/suspend",
  can("trust.manage"),
  upload.none(),
  validate(adminSchemas.trustJobActionSchema),
  TrustAdminController.suspendJob,
);
router.patch(
  "/trust/jobs/:jobId/suspend",
  can("trust.manage"),
  upload.none(),
  validate(adminSchemas.trustJobActionSchema),
  TrustAdminController.suspendJob,
);
router.post(
  "/trust/jobs/:jobId/request-documents",
  can("trust.manage"),
  upload.none(),
  validate(adminSchemas.trustJobActionSchema),
  TrustAdminController.requestDocuments,
);
router.patch(
  "/trust/jobs/:jobId/request-documents",
  can("trust.manage"),
  upload.none(),
  validate(adminSchemas.trustJobActionSchema),
  TrustAdminController.requestDocuments,
);

router.get(
  "/operations/talent-requests",
  can("talentrequests.manage"),
  adminModerationController.listTalentRequests,
);
router.get(
  "/talent-requests",
  can("talentrequests.manage"),
  validate(adminSchemas.talentRequestListSchema),
  adminModerationController.listTalentRequests,
);
router.post(
  "/talent-requests",
  can("talentrequests.manage"),
  upload.none(),
  validate(adminSchemas.talentRequestListSchema),
  adminModerationController.listTalentRequests,
);
router.patch(
  "/talent-requests/:id/status",
  can("talentrequests.manage"),
  upload.none(),
  validate(adminSchemas.talentRequestStatusSchema),
  adminModerationController.updateTalentRequestStatus,
);
router.post(
  "/talent-requests/:id/status",
  can("talentrequests.manage"),
  upload.none(),
  validate(adminSchemas.talentRequestStatusSchema),
  adminModerationController.updateTalentRequestStatus,
);

router.post(
  "/subscriptions/seed-free",
  can("subscriptions.manage"),
  upload.none(),
  validate(adminSchemas.seedFreePlanSchema),
  adminModerationController.seedFreePlan,
);
router.get(
  "/subscriptions/companies/:companyId",
  can("subscriptions.manage"),
  adminModerationController.getCompanySubscription,
);
router.post(
  "/subscriptions/companies/:companyId/assign-plan",
  can("subscriptions.manage"),
  upload.none(),
  validate(adminSchemas.assignSubscriptionPlanSchema),
  adminModerationController.assignSubscriptionPlan,
);

/* ----------------------------- Legacy upload/import routes ----------------------------- */
router.use("/exsel", can("jobs.moderate"), exselRoute);
router.use("/excel", can("jobs.moderate"), exselRoute);
router.use("/import", can("jobs.moderate"), exselRoute);

/* ----------------------------- Special routes ----------------------------- */
router.use("/Keyword", keywordRoute);
router.use("/keyword", keywordRoute);
router.use("/cv", cvRoute);
router.use("/cv-template", createDashResourceRouter("cvtemplates"));
router.use("/cv-templates", createDashResourceRouter("cvtemplates"));

/* ----------------------------- Interview prep question bank ----------------------------- */
router.get(
  "/interview-prep/questions",
  can(["interview_prep.view", "interview_prep.manage", "dashboard.view"]),
  validate(interviewPrepSchemas.listSchema),
  InterviewPrepAdminController.listQuestions,
);
router.post(
  "/interview-prep/questions",
  can("interview_prep.manage"),
  upload.none(),
  validate(interviewPrepSchemas.questionCreateSchema),
  InterviewPrepAdminController.createQuestion,
);
router.patch(
  "/interview-prep/questions/:id",
  can("interview_prep.manage"),
  upload.none(),
  validate(interviewPrepSchemas.questionUpdateSchema),
  InterviewPrepAdminController.updateQuestion,
);
router.delete(
  "/interview-prep/questions/:id",
  can("interview_prep.manage"),
  validate(interviewPrepSchemas.questionDeleteSchema),
  InterviewPrepAdminController.deleteQuestion,
);

/* ----------------------------- Learning resource library ----------------------------- */
router.get(
  "/learning-resources",
  can(["learning_resources.view", "learning_resources.manage", "dashboard.view"]),
  validate(resourceSchemas.resourceListSchema),
  LearningResourceAdminController.listResources,
);
router.post(
  "/learning-resources",
  can("learning_resources.manage"),
  upload.none(),
  validate(resourceSchemas.learningResourceCreateSchema),
  LearningResourceAdminController.createResource,
);
router.get(
  "/learning-resources/:id",
  can(["learning_resources.view", "learning_resources.manage", "dashboard.view"]),
  validate(resourceSchemas.learningResourceIdSchema),
  LearningResourceAdminController.getResource,
);
router.patch(
  "/learning-resources/:id",
  can("learning_resources.manage"),
  upload.none(),
  validate(resourceSchemas.learningResourceUpdateSchema),
  LearningResourceAdminController.updateResource,
);
router.delete(
  "/learning-resources/:id",
  can("learning_resources.manage"),
  validate(resourceSchemas.learningResourceDeleteSchema),
  LearningResourceAdminController.deleteResource,
);
router.post(
  "/learning-resources/:id/publish",
  can("learning_resources.manage"),
  upload.none(),
  validate(resourceSchemas.learningResourceStatusSchema),
  LearningResourceAdminController.publishResource,
);
router.post(
  "/learning-resources/:id/archive",
  can("learning_resources.manage"),
  upload.none(),
  validate(resourceSchemas.learningResourceStatusSchema),
  LearningResourceAdminController.archiveResource,
);
router.get(
  "/learning-resource-categories",
  can(["learning_resources.view", "learning_resources.manage", "dashboard.view"]),
  validate(resourceSchemas.resourceListSchema),
  LearningResourceAdminController.listCategories,
);
router.post(
  "/learning-resource-categories",
  can("learning_resources.manage"),
  upload.none(),
  validate(resourceSchemas.resourceCategoryCreateSchema),
  LearningResourceAdminController.createCategory,
);
router.patch(
  "/learning-resource-categories/:id",
  can("learning_resources.manage"),
  upload.none(),
  validate(resourceSchemas.resourceCategoryUpdateSchema),
  LearningResourceAdminController.updateCategory,
);

/* ----------------------------- Legacy resource aliases used by old dashboard ----------------------------- */
router.use("/Role", createDashResourceRouter("roles"));
router.use("/roles", createDashResourceRouter("roles"));
router.use("/Permission", createDashResourceRouter("permissions"));
router.use("/permissions", createDashResourceRouter("permissions"));
router.use("/User", createDashResourceRouter("users"));
router.use("/Users", createDashResourceRouter("users"));
router.use("/users", createDashResourceRouter("users"));
router.use("/Admin", createDashResourceRouter("admins"));
router.use("/Admins", createDashResourceRouter("admins"));
router.use("/admins", createDashResourceRouter("admins"));
router.use("/Employee", createDashResourceRouter("employees"));
router.use("/Employees", createDashResourceRouter("employees"));
router.use("/employees", createDashResourceRouter("employees"));
router.use("/Company", createDashResourceRouter("companies"));
router.use("/Companies", createDashResourceRouter("companies"));
router.use("/companies", createDashResourceRouter("companies"));
router.use("/CompanyReview", createDashResourceRouter("companyreviews"));
router.use("/company-reviews", createDashResourceRouter("companyreviews"));
router.use("/Industry", createDashResourceRouter("industries"));
router.use("/industries", createDashResourceRouter("industries"));

router.use("/Job", createDashResourceRouter("jobs"));
router.use("/Jobs", createDashResourceRouter("jobs"));
router.use("/jobs", createDashResourceRouter("jobs"));
router.use("/JobName", createDashResourceRouter("jobnames"));
router.use("/job-names", createDashResourceRouter("jobnames"));
router.use("/JobService", createDashResourceRouter("jobservices"));
router.use("/job-services", createDashResourceRouter("jobservices"));
router.use("/JobType", createDashResourceRouter("jobtypes"));
router.use("/job-types", createDashResourceRouter("jobtypes"));
router.use("/JobSalary", createDashResourceRouter("jobsalaries"));
router.use("/job-salaries", createDashResourceRouter("jobsalaries"));
router.use("/WorkTime", createDashResourceRouter("worktime"));
router.use("/work-times", createDashResourceRouter("worktime"));
router.use("/WorkMode", createDashResourceRouter("workmodes"));
router.use("/work-modes", createDashResourceRouter("workmodes"));
router.use("/WorkLocation", createDashResourceRouter("worklocations"));
router.use("/work-locations", createDashResourceRouter("worklocations"));

router.use(
  "/ApplicationHistory",
  createDashResourceRouter("applicationhistory"),
);
router.use(
  "/application-history",
  createDashResourceRouter("applicationhistory"),
);
router.use(
  "/OutsideApplication",
  createDashResourceRouter("outsideapplications"),
);
router.use(
  "/outside-applications",
  createDashResourceRouter("outsideapplications"),
);
router.use("/JobMatch", createDashResourceRouter("jobmatches"));
router.use("/job-matches", createDashResourceRouter("jobmatches"));
router.use("/JobEmployeeMatch", createDashResourceRouter("jobemployeematches"));
router.use(
  "/job-employee-matches",
  createDashResourceRouter("jobemployeematches"),
);
router.use("/Rating", createDashResourceRouter("ratings"));
router.use("/ratings", createDashResourceRouter("ratings"));
router.use("/Review", createDashResourceRouter("reviews"));
router.use("/reviews", createDashResourceRouter("reviews"));
router.use("/SavedJob", createDashResourceRouter("savedjobs"));
router.use("/saved-jobs", createDashResourceRouter("savedjobs"));
router.use("/ShownJob", createDashResourceRouter("shownjobs"));
router.use("/shown-jobs", createDashResourceRouter("shownjobs"));
router.use("/EmployeeCv", createDashResourceRouter("employeecvs"));
router.use("/employee-cvs", createDashResourceRouter("employeecvs"));
router.use("/UserResume", createDashResourceRouter("userresumes"));
router.use("/user-resumes", createDashResourceRouter("userresumes"));
router.use("/Application", createDashResourceRouter("applications"));
router.use("/Applications", createDashResourceRouter("applications"));
router.use("/applications", createDashResourceRouter("applications"));
router.use("/Interview", createDashResourceRouter("interviews"));
router.use("/Interviews", createDashResourceRouter("interviews"));
router.use("/interviews", createDashResourceRouter("interviews"));
router.use("/Invitation", createDashResourceRouter("invitations"));
router.use("/Invitations", createDashResourceRouter("invitations"));
router.use("/invitations", createDashResourceRouter("invitations"));
router.use("/Report", createDashResourceRouter("jobreports"));
router.use("/Reports", createDashResourceRouter("jobreports"));
router.use("/JobReport", createDashResourceRouter("jobreports"));
router.use("/reports", createDashResourceRouter("jobreports"));
router.use("/TalentRequest", createDashResourceRouter("talentrequests"));
router.use("/talent-requests", createDashResourceRouter("talentrequests"));
router.use("/University", createDashResourceRouter("universities"));
router.use("/Universities", createDashResourceRouter("universities"));
router.use("/universities", createDashResourceRouter("universities"));
router.get(
  "/campus/universities",
  can("universities.read"),
  validate(adminSchemas.listResourceSchema),
  campusController.listUniversities,
);
router.post(
  "/campus/universities",
  can("universities.manage"),
  upload.none(),
  validate(adminSchemas.universityCreateSchema),
  campusController.createUniversity,
);
router.patch(
  "/campus/universities/:id/status",
  can("universities.manage"),
  upload.none(),
  validate(adminSchemas.universityStatusSchema),
  campusController.updateUniversityStatus,
);
router.get(
  "/campus/partners",
  can("universities.read"),
  validate(adminSchemas.listResourceSchema),
  campusController.adminCampusPartners,
);
router.get(
  "/campus/privacy-audit",
  can("universities.read"),
  validate(adminSchemas.listResourceSchema),
  campusController.adminCampusPrivacyAudit,
);

router.use("/Country", createDashResourceRouter("countries"));
router.use("/countries", createDashResourceRouter("countries"));
router.use("/Currency", createDashResourceRouter("currencies"));
router.use("/currencies", createDashResourceRouter("currencies"));
router.use("/Language", createDashResourceRouter("languages"));
router.use("/languages", createDashResourceRouter("languages"));
router.use("/Skill", createDashResourceRouter("skills"));
router.use("/skills", createDashResourceRouter("skills"));
router.use("/EducationLevel", createDashResourceRouter("educationlevels"));
router.use("/education-levels", createDashResourceRouter("educationlevels"));
router.use("/ExperienceLevel", createDashResourceRouter("experiencelevels"));
router.use("/experience-levels", createDashResourceRouter("experiencelevels"));

router.use("/Color", createDashResourceRouter("colors"));
router.use("/colors", createDashResourceRouter("colors"));
router.use("/Font", createDashResourceRouter("fonts"));
router.use("/fonts", createDashResourceRouter("fonts"));
router.use("/Resume", createDashResourceRouter("resumes"));
router.use("/resumes", createDashResourceRouter("resumes"));
router.use("/Banner", createDashResourceRouter("banners"));
router.use("/Banners", createDashResourceRouter("banners"));
router.use("/banners", createDashResourceRouter("banners"));
router.use("/Page", createDashResourceRouter("pages"));
router.use("/Pages", createDashResourceRouter("pages"));
router.use("/pages", createDashResourceRouter("pages"));

// Legal / Help / Support / Privacy content package (Gate 3) admin management
router.use("/content/pages", createDashResourceRouter("contentpages"));
router.use("/content-pages", createDashResourceRouter("contentpages"));
router.use("/help/categories", createDashResourceRouter("helpcategories"));
router.use("/help-categories", createDashResourceRouter("helpcategories"));
router.use("/help/articles", createDashResourceRouter("helparticles"));
router.use("/help-articles", createDashResourceRouter("helparticles"));
router.use("/faq", createDashResourceRouter("faqitems"));
router.use("/faq-items", createDashResourceRouter("faqitems"));
router.use("/support-queue", createDashResourceRouter("supporttickets"));
router.use("/legal-reports", createDashResourceRouter("legalreports"));
router.use("/privacy-requests", createDashResourceRouter("privacyrequests"));
router.use(
  "/accessibility-requests",
  createDashResourceRouter("accessibilityrequests"),
);
router.use("/email/templates", createDashResourceRouter("emailtemplates"));
router.use("/email-templates", createDashResourceRouter("emailtemplates"));
router.use("/email/logs", createDashResourceRouter("emaillogs"));
router.use("/email-logs", createDashResourceRouter("emaillogs"));
router.use(
  "/policy-acknowledgements",
  createDashResourceRouter("policyacknowledgements"),
);
router.use("/Notification", createDashResourceRouter("notifications"));
router.use("/notifications", createDashResourceRouter("notifications"));
router.use("/FcmToken", createDashResourceRouter("fcmtokens"));
router.use("/fcm-tokens", createDashResourceRouter("fcmtokens"));
router.use("/SearchHistory", createDashResourceRouter("searchhistory"));
router.use("/search-history", createDashResourceRouter("searchhistory"));

router.use("/SubscriptionPlan", createDashResourceRouter("subscriptionplans"));
router.use("/SubscriptionPlans", createDashResourceRouter("subscriptionplans"));
router.use(
  "/subscription-plans",
  createDashResourceRouter("subscriptionplans"),
);
router.use(
  "/CompanySubscription",
  createDashResourceRouter("companysubscriptions"),
);
router.use(
  "/CompanySubscriptions",
  createDashResourceRouter("companysubscriptions"),
);
router.use(
  "/company-subscriptions",
  createDashResourceRouter("companysubscriptions"),
);
router.use("/Settings", createDashResourceRouter("settings"));
router.use("/settings", createDashResourceRouter("settings"));

/* ----------------------------- Generic API for new dashboard screens ----------------------------- */
router.get(
  "/resources/:resource",
  checkResourcePermission("read"),
  validate(adminSchemas.genericListResourceSchema),
  resourceController.list(),
);
router.get(
  "/resources/:resource/:id",
  checkResourcePermission("read"),
  validate(adminSchemas.genericGetResourceSchema),
  resourceController.getOne(),
);
router.post(
  "/resources/:resource/bulk-update",
  checkResourcePermission("update"),
  upload.none(),
  validate(adminSchemas.genericBulkUpdateResourceSchema),
  resourceController.bulkUpdate(),
);
router.patch(
  "/resources/:resource/bulk-update",
  checkResourcePermission("update"),
  upload.none(),
  validate(adminSchemas.genericBulkUpdateResourceSchema),
  resourceController.bulkUpdate(),
);
router.post(
  "/resources/:resource",
  checkResourcePermission("create"),
  upload.any(),
  validate(adminSchemas.genericCreateResourceSchema),
  resourceController.create(),
);
router.put(
  "/resources/:resource/:id",
  checkResourcePermission("update"),
  upload.any(),
  validate(adminSchemas.genericUpdateResourceSchema),
  resourceController.update(),
);
router.patch(
  "/resources/:resource/:id",
  checkResourcePermission("update"),
  upload.any(),
  validate(adminSchemas.genericUpdateResourceSchema),
  resourceController.update(),
);
router.delete(
  "/resources/:resource/:id",
  checkResourcePermission("delete"),
  validate(adminSchemas.genericDeleteResourceSchema),
  resourceController.remove(),
);
router.post(
  "/resources/:resource/:id/approve",
  checkResourcePermission("approve"),
  upload.none(),
  validate(adminSchemas.genericStatusResourceSchema),
  resourceController.approve(),
);
router.post(
  "/resources/:resource/:id/reject",
  checkResourcePermission("reject"),
  upload.none(),
  validate(adminSchemas.genericStatusResourceSchema),
  resourceController.reject(),
);

export default router;
