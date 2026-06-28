import express from "express";

import dashboardController from "../controllers/companyDash/dashboard/companyDashboardController.js";
import infoController from "../controllers/companyDash/information/companyInformationController.js";
import jobsController from "../controllers/companyDash/companyWithJobs/companyWithJobsController.js";
import applicantsController from "../controllers/companyDash/companyWithApplicants/companyWithApplicantsController.js";
import analyticsController from "../controllers/companyDash/companyAnalytics/companyAnalyticsController.js";
import companySubscriptionController from "../controllers/companyDash/subscription/companySubscriptionController.js";
import auditController from "../controllers/companyDash/audit/companyAuditController.js";
import questionLibraryController from "../controllers/companyDash/questionLibrary/companyQuestionLibraryController.js";
import messageTemplateController from "../controllers/companyDash/messages/companyMessageTemplateController.js";
import supportController from "../controllers/companyDash/support/companySupportController.js";
import memberController from "../controllers/companyDash/members/companyMemberController.js";

import multer from "../utils/multer.js";
import companyFileUpload from "../utils/multerCompanyFiles.js";
import { requireCompanyPermission } from "../helper/companyDash/companyDashHelpers.js";
import validate from "../middlewares/validate.js";
import companySchemas from "../validations/company.validation.js";

const upload = multer;
const router = express.Router();

/* Dashboard */
router.get("/", dashboardController.getCompanyDashboard);
router.get("/profile", validate(companySchemas.bodySchema), infoController.getMyCompanyProfile);
router.get("/me/basic-profile", validate(companySchemas.bodySchema), infoController.getMyBasicCompanyProfile);
router.put("/me/basic-profile", upload.single("image"), validate(companySchemas.uploadBodySchema), infoController.updateMyCompanyUserProfile);
router.put("/me/image", upload.single("image"), validate(companySchemas.uploadBodySchema), infoController.updateMyCompanyUserProfile);
router.get("/profile/completion", infoController.getMyCompanyCompletion);
router.get("/subscription/current", requireCompanyPermission("billing.manage"), companySubscriptionController.getMySubscription);
router.get("/subscription", requireCompanyPermission("billing.manage"), companySubscriptionController.getMySubscription);
router.get("/subscription/billing-summary", requireCompanyPermission("billing.manage"), companySubscriptionController.getBillingSummary);
router.get("/subscription/invoices", requireCompanyPermission("billing.manage"), companySubscriptionController.getMyInvoices);
router.get("/subscription/invoices/:invoiceId", requireCompanyPermission("billing.manage"), companySubscriptionController.getMyInvoiceDetails);
router.post("/subscription/request", requireCompanyPermission("billing.manage"), upload.none(), validate(companySchemas.bodySchema), companySubscriptionController.requestPlanChange);
router.post("/profile/rebuild-search-filters", requireCompanyPermission("company.profile.manage"), upload.none(), validate(companySchemas.bodySchema), infoController.rebuildMyCompanySearchFilters);

/* Company profile */
router.put("/profile", requireCompanyPermission("company.profile.manage"), upload.none(), validate(companySchemas.bodySchema), infoController.updateBasicCompanyProfile);
router.put("/profile/about", requireCompanyPermission("company.profile.manage"), upload.none(), validate(companySchemas.bodySchema), infoController.updateCompanyAbout);
router.put("/profile/contact", requireCompanyPermission("company.profile.manage"), upload.none(), validate(companySchemas.bodySchema), infoController.updateCompanyContact);
router.put("/profile/location", requireCompanyPermission("company.profile.manage"), upload.none(), validate(companySchemas.bodySchema), infoController.updateCompanyLocation);
router.put(
  "/profile/media",
  requireCompanyPermission("company.profile.manage"),
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "cover_image", maxCount: 1 },
  ]),
  validate(companySchemas.uploadBodySchema),
  infoController.updateCompanyMedia
);
router.get("/profile/files", validate(companySchemas.listSchema), infoController.listCompanyFiles);
router.post("/profile/files", requireCompanyPermission("company.profile.manage"), companyFileUpload.single("file"), validate(companySchemas.uploadBodySchema), infoController.uploadCompanyFile);
router.delete("/profile/files/:filename", requireCompanyPermission("company.profile.manage"), validate(companySchemas.fileDeleteSchema), infoController.deleteCompanyFile);
router.get("/profile/files/:filename/download", infoController.downloadCompanyFile);

/* Dynamic company sections */
router.get("/profile/:section", validate(companySchemas.profileSectionSchema), infoController.getMySection);
router.put("/profile/:section", requireCompanyPermission("company.profile.manage"), upload.none(), validate(companySchemas.profileSectionSchema), infoController.replaceSection);
router.post("/profile/:section", requireCompanyPermission("company.profile.manage"), upload.none(), validate(companySchemas.profileSectionSchema), infoController.addSectionItems);
router.patch("/profile/:section/:itemId", requireCompanyPermission("company.profile.manage"), upload.none(), validate(companySchemas.profileSectionItemSchema), infoController.updateSectionItem);
router.delete("/profile/:section/:itemId", requireCompanyPermission("company.profile.manage"), upload.none(), validate(companySchemas.profileSectionItemSchema), infoController.deleteSectionItem);

/* Jobs */
router.get("/jobs", requireCompanyPermission("jobs.manage"), validate(companySchemas.listSchema), jobsController.getMyJobs);
router.get("/jobs/statistics", requireCompanyPermission("jobs.manage"), jobsController.getJobsStatistics);
router.patch("/jobs/bulk", requireCompanyPermission("jobs.manage"), upload.none(), validate(companySchemas.bulkSchema), jobsController.bulkUpdateJobs);

router.post("/jobs", requireCompanyPermission("jobs.manage"), upload.none(), validate(companySchemas.bodySchema), jobsController.createJob);

router.get("/jobs/:jobId/recommended-employees", requireCompanyPermission("ats.view"), jobsController.getRecommendedEmployeesForJob);
router.get("/jobs/:jobId/applicants", requireCompanyPermission("ats.view"), applicantsController.getJobApplicants);
router.get("/jobs/:jobId", requireCompanyPermission("jobs.manage"), validate(companySchemas.jobBodySchema), jobsController.getMyJobDetails);

router.post("/jobs/:jobId", requireCompanyPermission("jobs.manage"), upload.none(), validate(companySchemas.jobBodySchema), jobsController.updateJob); // compatibility
router.put("/jobs/:jobId", requireCompanyPermission("jobs.manage"), upload.none(), validate(companySchemas.jobBodySchema), jobsController.updateJob);
router.patch("/jobs/:jobId", requireCompanyPermission("jobs.manage"), upload.none(), validate(companySchemas.jobBodySchema), jobsController.updateJob);

router.delete("/jobs/:jobId", requireCompanyPermission("jobs.manage"), upload.none(), validate(companySchemas.jobBodySchema), jobsController.deleteJob);

router.patch("/jobs/:jobId/status", requireCompanyPermission("jobs.manage"), upload.none(), validate(companySchemas.jobBodySchema), jobsController.changeJobStatus);
router.patch("/jobs/:jobId/publish", requireCompanyPermission("jobs.manage"), upload.none(), validate(companySchemas.jobBodySchema), jobsController.publishJob);
router.patch("/jobs/:jobId/pause", requireCompanyPermission("jobs.manage"), upload.none(), validate(companySchemas.jobBodySchema), jobsController.pauseJob);
router.patch("/jobs/:jobId/archive", requireCompanyPermission("jobs.manage"), upload.none(), validate(companySchemas.jobBodySchema), jobsController.archiveJob);
router.patch("/jobs/:jobId/restore", requireCompanyPermission("jobs.manage"), upload.none(), validate(companySchemas.jobBodySchema), jobsController.restoreJob);
router.post("/jobs/:jobId/clone", requireCompanyPermission("jobs.manage"), upload.none(), validate(companySchemas.jobBodySchema), jobsController.cloneJob);
/* Applicants */
router.get("/jobs/:jobId/applicants", requireCompanyPermission("ats.view"), applicantsController.getJobApplicants);
router.get("/applications", requireCompanyPermission("ats.view"), applicantsController.getAllApplications);
router.get("/applications/:applicationId", requireCompanyPermission("ats.view"), applicantsController.getApplicationDetails);
router.patch("/applications/:applicationId/status", requireCompanyPermission("ats.status.change"), upload.none(), validate(companySchemas.applicationStatusSchema), applicantsController.changeApplicationStatus);
router.post("/applications/:applicationId/note", requireCompanyPermission("ats.notes.add"), upload.none(), validate(companySchemas.applicationBodySchema), applicantsController.addApplicationNote);
router.post("/applications/:applicationId/rate", requireCompanyPermission("ats.notes.add"), upload.none(), validate(companySchemas.applicationBodySchema), applicantsController.rateApplicant);

/* Interviews */
router.get("/interviews", requireCompanyPermission("ats.view"), validate(companySchemas.listSchema), applicantsController.getCompanyInterviews);
router.post("/interviews", requireCompanyPermission("ats.interviews.schedule"), upload.none(), validate(companySchemas.interviewCreateSchema), applicantsController.scheduleInterview);
router.patch("/interviews/:interviewId", requireCompanyPermission("ats.interviews.schedule"), upload.none(), validate(companySchemas.interviewBodySchema), applicantsController.updateInterview);
router.delete("/interviews/:interviewId", requireCompanyPermission("ats.interviews.schedule"), upload.none(), validate(companySchemas.interviewBodySchema), applicantsController.cancelInterview);

/* Audit logs */
router.get("/audit-logs", requireCompanyPermission("audit.view"), auditController.getAuditLogs);
router.get("/jobs/:jobId/audit-logs", requireCompanyPermission("audit.view"), auditController.getJobAuditLogs);
router.get("/applications/:applicationId/audit-logs", requireCompanyPermission("audit.view"), auditController.getApplicationAuditLogs);

/* Question library */
router.get("/question-library", requireCompanyPermission("question_library.manage"), validate(companySchemas.listSchema), questionLibraryController.listQuestions);
router.post("/question-library", requireCompanyPermission("question_library.manage"), upload.none(), validate(companySchemas.bodySchema), questionLibraryController.createQuestion);
router.patch("/question-library/:questionId", requireCompanyPermission("question_library.manage"), upload.none(), validate(companySchemas.questionBodySchema), questionLibraryController.updateQuestion);
router.delete("/question-library/:questionId", requireCompanyPermission("question_library.manage"), upload.none(), validate(companySchemas.questionBodySchema), questionLibraryController.deleteQuestion);

/* Message templates */
router.get("/message-templates", requireCompanyPermission("message_templates.manage"), validate(companySchemas.listSchema), messageTemplateController.listTemplates);
router.post("/message-templates", requireCompanyPermission("message_templates.manage"), upload.none(), validate(companySchemas.bodySchema), messageTemplateController.createTemplate);
router.patch("/message-templates/:templateId", requireCompanyPermission("message_templates.manage"), upload.none(), validate(companySchemas.templateBodySchema), messageTemplateController.updateTemplate);
router.delete("/message-templates/:templateId", requireCompanyPermission("message_templates.manage"), upload.none(), validate(companySchemas.templateBodySchema), messageTemplateController.deleteTemplate);

/* Company support center */
router.get("/support-tickets", requireCompanyPermission("support.manage"), validate(companySchemas.listSchema), supportController.listTickets);
router.post("/support-tickets", requireCompanyPermission("support.manage"), upload.none(), validate(companySchemas.bodySchema), supportController.createTicket);
router.get("/support-tickets/:ticketId", requireCompanyPermission("support.manage"), supportController.getTicketDetails);
router.post("/support-tickets/:ticketId/messages", requireCompanyPermission("support.manage"), upload.none(), validate(companySchemas.ticketBodySchema), supportController.addTicketMessage);

/* Company members and permissions */
router.get("/members", requireCompanyPermission("company.members.manage"), validate(companySchemas.listSchema), memberController.listMembers);
router.post("/members", requireCompanyPermission("company.members.manage"), upload.none(), validate(companySchemas.bodySchema), memberController.upsertMember);
router.patch("/members/:memberId", requireCompanyPermission("company.members.manage"), upload.none(), validate(companySchemas.memberBodySchema), memberController.updateMember);
router.delete("/members/:memberId", requireCompanyPermission("company.members.manage"), upload.none(), validate(companySchemas.memberBodySchema), memberController.removeMember);

/* Analytics */
router.get("/analytics", requireCompanyPermission("analytics.view"), analyticsController.getCompanyAnalytics);
router.get("/analytics/jobs", requireCompanyPermission("analytics.view"), analyticsController.getJobsAnalytics);
router.get("/analytics/applications", requireCompanyPermission("analytics.view"), analyticsController.getApplicationsAnalytics);
router.get("/analytics/profile", requireCompanyPermission("analytics.view"), analyticsController.getProfileAnalytics);

export default router;
