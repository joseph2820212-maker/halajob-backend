import express from "express";
import controllerHiring from "../controllers/companyDash/companyWithJobs/companyJobHiringController.js";
import controllerTalent from "../controllers/companyDash/companyWithJobs/companyTalentSearchController.js";
import multer from "../utils/multer.js";

const upload = multer;
const router = express.Router();

/* =========================
   Hiring Dashboard / Summary
========================= */
router.get("/hiring/summary", upload.none(), controllerHiring.getHiringSummary);

/* =========================
   Applications / Applicants
========================= */
router.get("/hiring/applications", upload.none(), controllerHiring.getJobApplications);
router.get("/hiring/:jobId/applications", upload.none(), controllerHiring.getJobApplications);

router.get("/hiring/applicants", upload.none(), controllerHiring.getApplicants);
router.get("/hiring/:jobId/applicants", upload.none(), controllerHiring.getApplicants);

router.get("/hiring/applications/:applicationId", upload.none(), controllerHiring.getApplicationDetails);
router.get("/hiring/applications/:applicationId/cv", upload.none(), controllerHiring.getApplicationCv);
router.patch("/hiring/applications/:applicationId/status", upload.none(), controllerHiring.updateApplicationStatus);
router.patch("/hiring/applications/:applicationId/block-applicant", upload.none(), controllerHiring.blockApplicationApplicant);

/* =========================
   Interviews
========================= */
router.post("/hiring/interviews", upload.none(), controllerHiring.createInterview);
router.post("/hiring/applications/:applicationId/interviews", upload.none(), controllerHiring.createInterview);

router.get("/hiring/interviews", upload.none(), controllerHiring.getInterviews);
router.patch("/hiring/interviews/:interviewId", upload.none(), controllerHiring.updateInterview);
router.patch("/hiring/interviews/:interviewId/status", upload.none(), controllerHiring.changeInterviewStatus);

/* =========================
   Job Invitations / Offers
========================= */
router.post("/hiring/invitations", upload.none(), controllerHiring.sendJobInvitation);
router.post("/hiring/:jobId/invitations", upload.none(), controllerHiring.sendJobInvitation);

router.get("/hiring/invitations", upload.none(), controllerHiring.getJobInvitations);
router.get("/hiring/invitations/:invitationId", upload.none(), controllerHiring.getJobInvitationDetails);
router.patch("/hiring/invitations/:invitationId/cancel", upload.none(), controllerHiring.cancelJobInvitation);

/* =========================
   Job Reviews - Read Only For Company
========================= */
router.get("/hiring/reviews", upload.none(), controllerHiring.getCompanyJobReviews);

/* =========================
   Talent Search
========================= */
router.get("/talent/employees", upload.none(), controllerTalent.searchEmployees);
router.get("/talent/employees/:employeeId", upload.none(), controllerTalent.getEmployeeDetails);

/* =========================
   JobZain Talent Help Requests
========================= */
router.post("/talent/help-requests", upload.none(), controllerTalent.requestJobZainTalentHelp);
router.get("/talent/help-requests", upload.none(), controllerTalent.getMyJobZainTalentRequests);
router.get("/talent/help-requests/:requestId", upload.none(), controllerTalent.getJobZainTalentRequestDetails);
router.patch("/talent/help-requests/:requestId/cancel", upload.none(), controllerTalent.cancelJobZainTalentRequest);

/* =========================
   Smart Employees Matching
========================= */
router.post("/talent/:jobId/smart-employees/generate", upload.none(), controllerTalent.generateSmartEmployeesForJob);
router.get("/talent/:jobId/smart-employees", upload.none(), controllerTalent.getSmartEmployeesForJob);
router.get("/talent/:jobId/employees/:employeeId/match", upload.none(), controllerTalent.matchEmployeeWithJob);
router.post(
  "/talent/:jobId/smart-employees/generate",
  upload.none(),
  controllerTalent.generateSmartEmployeesForJob
);
export default router;
