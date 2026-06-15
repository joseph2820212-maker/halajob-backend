import express from "express";
import dashboardController from "../controllers/employeeDash/dashboard/employeeDashboardController.js";
import infoController from "../controllers/employeeDash/information/employeeInformationController.js";
import jobsController from "../controllers/employeeDash/employeeWithJobs/employeeWithJobsController.js";
import companiesController from "../controllers/employeeDash/employeeWithCompanies/employeeWithCompaniesController.js";
import multer from "../utils/multer.js";

const upload = multer;
const router = express.Router();

/* Dashboard */
router.get("/", dashboardController.getEmployeeDashboard);
router.get("/profile", infoController.getMyEmployeeProfile);
router.get("/me/basic-profile", infoController.getMyBasicProfile);
router.get("/profile/completion", infoController.getMyEmployeeCompletion);
router.post("/profile/rebuild-search-filters", upload.none(), infoController.rebuildMySearchFilters);

/* Employee profile */
router.put("/profile", upload.none(), infoController.updateBasicEmployeeProfile);
router.put("/me/basic-profile", upload.single("image"), infoController.updateMyBasicProfile);
router.put("/profile/about-me", upload.none(), infoController.updateAboutMe);
router.put("/profile/latest-work-experience", upload.none(), infoController.updateLatestWorkExperience);
router.put("/profile/work-preferences", upload.none(), infoController.updateWorkPreferences);

/* Backward compatible profile aliases */
router.put("/profile/job-names", upload.none(), infoController.replaceJobNames);
router.put("/profile/job-types", upload.none(), infoController.replaceJobTypes);
router.put("/profile/min-salary", upload.none(), infoController.replaceMinSalary);

/* Dynamic profile sections */
router.get("/profile/:section", infoController.getMySection);
router.put("/profile/:section", upload.none(), infoController.replaceSection);
router.post("/profile/:section", upload.none(), infoController.addSectionItems);
router.patch("/profile/:section/:itemId", upload.none(), infoController.updateSectionItem);
router.delete("/profile/:section/:itemId", upload.none(), infoController.deleteSectionItem);

/* Jobs */
router.get("/jobs", jobsController.browseJobs);
router.get("/jobs/recommended", jobsController.recommendedJobs);
router.get("/jobs/saved", jobsController.savedJobs);
router.get("/jobs/:jobId", jobsController.getJobDetails);
router.post("/jobs/:jobId/save", upload.none(), jobsController.saveJob);
router.delete("/jobs/:jobId/save", upload.none(), jobsController.unsaveJob);
router.post("/jobs/:jobId/apply", upload.none(), jobsController.applyToJob);
router.post("/jobs/:jobId/rate", upload.none(), jobsController.rateJob);
router.post("/jobs/:jobId/review", upload.none(), jobsController.reviewJob);

/* Applications */
router.get("/applications", jobsController.myApplications);
router.get("/applications/applied", jobsController.myApplications);
router.get("/applications/status", jobsController.myApplications);
router.get("/applications/rejected", jobsController.myRejectedApplications);

/* Interviews */
router.get("/applications/interviews", jobsController.myInterviews);
router.patch("/applications/interviews/:interviewId/respond", upload.none(), jobsController.respondToInterview);

/* Job invitations / offers */
router.get("/applications/offers", jobsController.myJobInvitations);
router.get("/applications/offers/:invitationId", jobsController.getMyJobInvitationDetails);
router.patch("/applications/offers/:invitationId/respond", upload.none(), jobsController.respondToJobInvitation);
router.patch("/applications/offers/:invitationId/reject", upload.none(), (req, res, next) => {
  req.body.status = "declined";
  return jobsController.respondToJobInvitation(req, res, next);
});

router.get("/applications/:applicationId", jobsController.getMyApplicationDetails);
router.post("/applications/:applicationId/messages", upload.none(), jobsController.addApplicationMessage);
router.patch("/applications/:applicationId/cancel", upload.none(), jobsController.cancelMyApplication);

/* Companies */
router.get("/companies", companiesController.browseCompanies);
router.get("/companies/activity", companiesController.companiesFromMyActivity);
router.get("/companies/applied", companiesController.companiesIAppliedTo);
router.get("/companies/saved-jobs", companiesController.companiesFromSavedJobs);
router.get("/companies/viewed", companiesController.companiesViewedByMe);
router.get("/companies/:companyId", companiesController.companyDetails);
router.post("/companies/:companyId/review", upload.none(), companiesController.reviewCompany);

export default router;
