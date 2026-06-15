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
import { requireCompanyPermission } from "../helper/companyDash/companyDashHelpers.js";

const upload = multer;
const router = express.Router();

/* Dashboard */
router.get("/", dashboardController.getCompanyDashboard);
router.get("/profile", infoController.getMyCompanyProfile);
router.get("/me/basic-profile", infoController.getMyBasicCompanyProfile);
router.put("/me/basic-profile", upload.single("image"), infoController.updateMyCompanyUserProfile);
router.put("/me/image", upload.single("image"), infoController.updateMyCompanyUserProfile);
router.get("/profile/completion", infoController.getMyCompanyCompletion);
router.get("/subscription/current", companySubscriptionController.getMySubscription);
router.get("/subscription", companySubscriptionController.getMySubscription);
router.get("/subscription/billing-summary", companySubscriptionController.getBillingSummary);
router.get("/subscription/invoices", companySubscriptionController.getMyInvoices);
router.get("/subscription/invoices/:invoiceId", companySubscriptionController.getMyInvoiceDetails);
router.post("/subscription/request", upload.none(), companySubscriptionController.requestPlanChange);
router.post("/profile/rebuild-search-filters", upload.none(), infoController.rebuildMyCompanySearchFilters);

/* Company profile */
router.put("/profile", upload.none(), infoController.updateBasicCompanyProfile);
router.put("/profile/about", upload.none(), infoController.updateCompanyAbout);
router.put("/profile/contact", upload.none(), infoController.updateCompanyContact);
router.put("/profile/location", upload.none(), infoController.updateCompanyLocation);
router.put(
  "/profile/media",
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "cover_image", maxCount: 1 },
  ]),
  infoController.updateCompanyMedia
);

/* Dynamic company sections */
router.get("/profile/:section", infoController.getMySection);
router.put("/profile/:section", upload.none(), infoController.replaceSection);
router.post("/profile/:section", upload.none(), infoController.addSectionItems);
router.patch("/profile/:section/:itemId", upload.none(), infoController.updateSectionItem);
router.delete("/profile/:section/:itemId", upload.none(), infoController.deleteSectionItem);

/* Jobs */
router.get("/jobs", requireCompanyPermission("jobs.manage"), jobsController.getMyJobs);
router.get("/jobs/statistics", requireCompanyPermission("jobs.manage"), jobsController.getJobsStatistics);
router.patch("/jobs/bulk", requireCompanyPermission("jobs.manage"), upload.none(), jobsController.bulkUpdateJobs);

router.post("/jobs", requireCompanyPermission("jobs.manage"), upload.none(), jobsController.createJob);

router.get("/jobs/:jobId/recommended-employees", requireCompanyPermission("ats.view"), jobsController.getRecommendedEmployeesForJob);
router.get("/jobs/:jobId/applicants", requireCompanyPermission("ats.view"), applicantsController.getJobApplicants);
router.get("/jobs/:jobId", requireCompanyPermission("jobs.manage"), jobsController.getMyJobDetails);

router.post("/jobs/:jobId", requireCompanyPermission("jobs.manage"), upload.none(), jobsController.updateJob); // compatibility
router.put("/jobs/:jobId", requireCompanyPermission("jobs.manage"), upload.none(), jobsController.updateJob);
router.patch("/jobs/:jobId", requireCompanyPermission("jobs.manage"), upload.none(), jobsController.updateJob);

router.delete("/jobs/:jobId", requireCompanyPermission("jobs.manage"), upload.none(), jobsController.deleteJob);

router.patch("/jobs/:jobId/status", requireCompanyPermission("jobs.manage"), upload.none(), jobsController.changeJobStatus);
router.patch("/jobs/:jobId/publish", requireCompanyPermission("jobs.manage"), upload.none(), jobsController.publishJob);
router.patch("/jobs/:jobId/pause", requireCompanyPermission("jobs.manage"), upload.none(), jobsController.pauseJob);
router.patch("/jobs/:jobId/archive", requireCompanyPermission("jobs.manage"), upload.none(), jobsController.archiveJob);
router.patch("/jobs/:jobId/restore", requireCompanyPermission("jobs.manage"), upload.none(), jobsController.restoreJob);
router.post("/jobs/:jobId/clone", requireCompanyPermission("jobs.manage"), upload.none(), jobsController.cloneJob);
/* Applicants */
router.get("/jobs/:jobId/applicants", requireCompanyPermission("ats.view"), applicantsController.getJobApplicants);
router.get("/applications", requireCompanyPermission("ats.view"), applicantsController.getAllApplications);
router.get("/applications/:applicationId", requireCompanyPermission("ats.view"), applicantsController.getApplicationDetails);
router.patch("/applications/:applicationId/status", requireCompanyPermission("ats.status.change"), upload.none(), applicantsController.changeApplicationStatus);
router.post("/applications/:applicationId/note", requireCompanyPermission("ats.notes.add"), upload.none(), applicantsController.addApplicationNote);
router.post("/applications/:applicationId/rate", requireCompanyPermission("ats.notes.add"), upload.none(), applicantsController.rateApplicant);

/* Interviews */
router.get("/interviews", requireCompanyPermission("ats.view"), applicantsController.getCompanyInterviews);
router.post("/interviews", requireCompanyPermission("ats.interviews.schedule"), upload.none(), applicantsController.scheduleInterview);
router.patch("/interviews/:interviewId", requireCompanyPermission("ats.interviews.schedule"), upload.none(), applicantsController.updateInterview);
router.delete("/interviews/:interviewId", requireCompanyPermission("ats.interviews.schedule"), upload.none(), applicantsController.cancelInterview);

/* Audit logs */
router.get("/audit-logs", requireCompanyPermission("audit.view"), auditController.getAuditLogs);
router.get("/jobs/:jobId/audit-logs", requireCompanyPermission("audit.view"), auditController.getJobAuditLogs);
router.get("/applications/:applicationId/audit-logs", requireCompanyPermission("audit.view"), auditController.getApplicationAuditLogs);

/* Question library */
router.get("/question-library", requireCompanyPermission("question_library.manage"), questionLibraryController.listQuestions);
router.post("/question-library", requireCompanyPermission("question_library.manage"), upload.none(), questionLibraryController.createQuestion);
router.patch("/question-library/:questionId", requireCompanyPermission("question_library.manage"), upload.none(), questionLibraryController.updateQuestion);
router.delete("/question-library/:questionId", requireCompanyPermission("question_library.manage"), upload.none(), questionLibraryController.deleteQuestion);

/* Message templates */
router.get("/message-templates", requireCompanyPermission("message_templates.manage"), messageTemplateController.listTemplates);
router.post("/message-templates", requireCompanyPermission("message_templates.manage"), upload.none(), messageTemplateController.createTemplate);
router.patch("/message-templates/:templateId", requireCompanyPermission("message_templates.manage"), upload.none(), messageTemplateController.updateTemplate);
router.delete("/message-templates/:templateId", requireCompanyPermission("message_templates.manage"), upload.none(), messageTemplateController.deleteTemplate);

/* Company support center */
router.get("/support-tickets", requireCompanyPermission("support.manage"), supportController.listTickets);
router.post("/support-tickets", requireCompanyPermission("support.manage"), upload.none(), supportController.createTicket);
router.get("/support-tickets/:ticketId", requireCompanyPermission("support.manage"), supportController.getTicketDetails);
router.post("/support-tickets/:ticketId/messages", requireCompanyPermission("support.manage"), upload.none(), supportController.addTicketMessage);

/* Company members and permissions */
router.get("/members", requireCompanyPermission("company.members.manage"), memberController.listMembers);
router.post("/members", requireCompanyPermission("company.members.manage"), upload.none(), memberController.upsertMember);
router.patch("/members/:memberId", requireCompanyPermission("company.members.manage"), upload.none(), memberController.updateMember);
router.delete("/members/:memberId", requireCompanyPermission("company.members.manage"), upload.none(), memberController.removeMember);

/* Analytics */
router.get("/analytics", analyticsController.getCompanyAnalytics);
router.get("/analytics/jobs", analyticsController.getJobsAnalytics);
router.get("/analytics/applications", analyticsController.getApplicationsAnalytics);
router.get("/analytics/profile", analyticsController.getProfileAnalytics);

export default router;
