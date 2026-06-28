import express from "express";
import controllerHiring from "../controllers/companyDash/companyWithJobs/companyJobHiringController.js";
import controllerTalent from "../controllers/companyDash/companyWithJobs/companyTalentSearchController.js";
import multer from "../utils/multer.js";
import { requireCompanyPermission } from "../helper/companyDash/companyDashHelpers.js";

const upload = multer;
const router = express.Router();

/* =========================
   Hiring Dashboard / Summary
========================= */
router.get("/hiring/summary", requireCompanyPermission("ats.view"), upload.none(), controllerHiring.getHiringSummary);
router.get("/hiring/pipeline", requireCompanyPermission("ats.view"), upload.none(), controllerHiring.getAtsPipeline);
router.get("/hiring/talent-pool", requireCompanyPermission("ats.view"), upload.none(), controllerHiring.getTalentPool);

/* =========================
   Applications / Applicants
========================= */
router.get("/hiring/applications", requireCompanyPermission("ats.view"), upload.none(), controllerHiring.getJobApplications);
router.get("/hiring/:jobId/applications", requireCompanyPermission("ats.view"), upload.none(), controllerHiring.getJobApplications);

router.get("/hiring/applicants", requireCompanyPermission("ats.view"), upload.none(), controllerHiring.getApplicants);
router.get("/hiring/:jobId/applicants", requireCompanyPermission("ats.view"), upload.none(), controllerHiring.getApplicants);

router.post("/hiring/applications/bulk-cv", requireCompanyPermission("ats.view"), upload.none(), controllerHiring.bulkApplicationCvs);
router.post("/hiring/applications/bulk-export", requireCompanyPermission("ats.view"), upload.none(), controllerHiring.bulkExportApplications);
router.get("/hiring/applications/:applicationId", requireCompanyPermission("ats.view"), upload.none(), controllerHiring.getApplicationDetails);
router.get("/hiring/applications/:applicationId/cv", requireCompanyPermission("ats.view"), upload.none(), controllerHiring.getApplicationCv);
router.patch("/hiring/applications/:applicationId/status", requireCompanyPermission("ats.status.change"), upload.none(), controllerHiring.updateApplicationStatus);
router.patch("/hiring/applications/:applicationId/restore", requireCompanyPermission("ats.status.change"), upload.none(), controllerHiring.restoreApplication);
router.post("/hiring/applications/:applicationId/messages", requireCompanyPermission("ats.messages.send"), upload.none(), controllerHiring.sendApplicationMessage);
router.patch("/hiring/applications/:applicationId/block-applicant", requireCompanyPermission("ats.reject"), upload.none(), controllerHiring.blockApplicationApplicant);

/* =========================
   Interviews
========================= */
router.post("/hiring/interviews", requireCompanyPermission("ats.interviews.schedule"), upload.none(), controllerHiring.createInterview);
router.post("/hiring/applications/:applicationId/interviews", requireCompanyPermission("ats.interviews.schedule"), upload.none(), controllerHiring.createInterview);

router.get("/hiring/interviews", requireCompanyPermission("ats.view"), upload.none(), controllerHiring.getInterviews);
router.patch("/hiring/interviews/:interviewId", requireCompanyPermission("ats.interviews.schedule"), upload.none(), controllerHiring.updateInterview);
router.patch("/hiring/interviews/:interviewId/status", requireCompanyPermission("ats.interviews.schedule"), upload.none(), controllerHiring.changeInterviewStatus);

/* =========================
   Job Invitations / Offers
========================= */
router.post("/hiring/invitations", requireCompanyPermission("ats.messages.send"), upload.none(), controllerHiring.sendJobInvitation);
router.post("/hiring/:jobId/invitations", requireCompanyPermission("ats.messages.send"), upload.none(), controllerHiring.sendJobInvitation);

router.get("/hiring/invitations", requireCompanyPermission("ats.view"), upload.none(), controllerHiring.getJobInvitations);
router.get("/hiring/invitations/:invitationId", requireCompanyPermission("ats.view"), upload.none(), controllerHiring.getJobInvitationDetails);
router.patch("/hiring/invitations/:invitationId/cancel", requireCompanyPermission("ats.messages.send"), upload.none(), controllerHiring.cancelJobInvitation);

/* =========================
   Job Reviews - Read Only For Company
========================= */
router.get("/hiring/reviews", requireCompanyPermission("ats.view"), upload.none(), controllerHiring.getCompanyJobReviews);

/* =========================
   Talent Search
========================= */
router.get("/talent/employees", requireCompanyPermission("ats.view"), upload.none(), controllerTalent.searchEmployees);
router.get("/talent/employees/:employeeId", requireCompanyPermission("ats.view"), upload.none(), controllerTalent.getEmployeeDetails);

/* =========================
   Hala Job Talent Support Requests (internal model/route function names retain
   the legacy "JobZainTalent" identifiers — documented in BRAND_CLEANUP_AUDIT.md)
========================= */
router.post("/talent/help-requests", requireCompanyPermission("ats.view"), upload.none(), controllerTalent.requestJobZainTalentHelp);
router.post("/talent/:jobId/help-requests", requireCompanyPermission("ats.view"), upload.none(), controllerTalent.requestJobZainTalentHelp);
router.get("/talent/help-requests", requireCompanyPermission("ats.view"), upload.none(), controllerTalent.getMyJobZainTalentRequests);
router.get("/talent/:jobId/help-requests", requireCompanyPermission("ats.view"), upload.none(), controllerTalent.getMyJobZainTalentRequests);
router.get("/talent/help-requests/:requestId", requireCompanyPermission("ats.view"), upload.none(), controllerTalent.getJobZainTalentRequestDetails);
router.patch("/talent/help-requests/:requestId/cancel", requireCompanyPermission("ats.view"), upload.none(), controllerTalent.cancelJobZainTalentRequest);

/* =========================
   Smart Employees Matching
========================= */
router.post("/talent/:jobId/smart-employees/generate", requireCompanyPermission("ats.view"), upload.none(), controllerTalent.generateSmartEmployeesForJob);
router.get("/talent/:jobId/smart-employees", requireCompanyPermission("ats.view"), upload.none(), controllerTalent.getSmartEmployeesForJob);
router.get("/talent/:jobId/employees/:employeeId/match", requireCompanyPermission("ats.view"), upload.none(), controllerTalent.matchEmployeeWithJob);
export default router;
