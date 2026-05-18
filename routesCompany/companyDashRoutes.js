import express from "express";

import dashboardController from "../controllers/companyDash/dashboard/companyDashboardController.js";
import infoController from "../controllers/companyDash/information/companyInformationController.js";
import jobsController from "../controllers/companyDash/companyWithJobs/companyWithJobsController.js";
import applicantsController from "../controllers/companyDash/companyWithApplicants/companyWithApplicantsController.js";
import analyticsController from "../controllers/companyDash/companyAnalytics/companyAnalyticsController.js";

import multer from "../utils/multer.js";

const upload = multer;
const router = express.Router();

/* Dashboard */
router.get("/", dashboardController.getCompanyDashboard);
router.get("/profile", infoController.getMyCompanyProfile);
router.get("/me/basic-profile", infoController.getMyBasicCompanyProfile);
router.get("/profile/completion", infoController.getMyCompanyCompletion);
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
router.get("/jobs", jobsController.getMyJobs);
router.get("/jobs/statistics", jobsController.getJobsStatistics);

router.post("/jobs", upload.none(), jobsController.createJob);

router.get("/jobs/:jobId/recommended-employees", jobsController.getRecommendedEmployeesForJob);
router.get("/jobs/:jobId/applicants", applicantsController.getJobApplicants);
router.get("/jobs/:jobId", jobsController.getMyJobDetails);

router.post("/jobs/:jobId", upload.none(), jobsController.updateJob); // compatibility
router.put("/jobs/:jobId", upload.none(), jobsController.updateJob);
router.patch("/jobs/:jobId", upload.none(), jobsController.updateJob);

router.delete("/jobs/:jobId", upload.none(), jobsController.deleteJob);

router.patch("/jobs/:jobId/status", upload.none(), jobsController.changeJobStatus);
router.patch("/jobs/:jobId/publish", upload.none(), jobsController.publishJob);
router.patch("/jobs/:jobId/archive", upload.none(), jobsController.archiveJob);
/* Applicants */
router.get("/jobs/:jobId/applicants", applicantsController.getJobApplicants);
router.get("/applications", applicantsController.getAllApplications);
router.get("/applications/:applicationId", applicantsController.getApplicationDetails);
router.patch("/applications/:applicationId/status", upload.none(), applicantsController.changeApplicationStatus);
router.post("/applications/:applicationId/note", upload.none(), applicantsController.addApplicationNote);
router.post("/applications/:applicationId/rate", upload.none(), applicantsController.rateApplicant);

/* Interviews */
router.get("/interviews", applicantsController.getCompanyInterviews);
router.post("/interviews", upload.none(), applicantsController.scheduleInterview);
router.patch("/interviews/:interviewId", upload.none(), applicantsController.updateInterview);
router.delete("/interviews/:interviewId", upload.none(), applicantsController.cancelInterview);

/* Analytics */
router.get("/analytics", analyticsController.getCompanyAnalytics);
router.get("/analytics/jobs", analyticsController.getJobsAnalytics);
router.get("/analytics/applications", analyticsController.getApplicationsAnalytics);
router.get("/analytics/profile", analyticsController.getProfileAnalytics);

export default router;
