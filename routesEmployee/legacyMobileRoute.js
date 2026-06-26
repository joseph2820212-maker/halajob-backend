import express from "express";
import jobsController from "../controllers/employeeDash/employeeWithJobs/employeeWithJobsController.js";
import companiesController from "../controllers/employeeDash/employeeWithCompanies/employeeWithCompaniesController.js";
import { authUser } from "../middlewares/userAuth.js";
import multer from "../utils/multer.js";

const upload = multer;
const router = express.Router();

// Compatibility aliases for older mobile clients. The canonical routes remain
// under /employee/v1/global/* and /user/v1/*.

/* Jobs */
router.post("/jobs/:jobId/apply", authUser, upload.none(), jobsController.applyToJob);
router.post("/jobs/:jobId/save", authUser, upload.none(), jobsController.saveJob);
router.delete("/jobs/:jobId/save", authUser, upload.none(), jobsController.unsaveJob);
router.post("/jobs/:jobId/rate", authUser, upload.none(), jobsController.rateJob);
router.post("/jobs/:jobId/review", authUser, upload.none(), jobsController.reviewJob);

/* Applications */
router.get("/applications", authUser, jobsController.myApplications);
router.get("/applications/interviews", authUser, jobsController.myInterviews);
router.patch(
  "/applications/interviews/:interviewId/respond",
  authUser,
  upload.none(),
  jobsController.respondToInterview
);
router.post(
  "/applications/interviews/:interviewId/respond",
  authUser,
  upload.none(),
  jobsController.respondToInterview
);
router.get("/applications/offers", authUser, jobsController.myJobInvitations);
router.patch(
  "/applications/offers/:invitationId/respond",
  authUser,
  upload.none(),
  jobsController.respondToJobInvitation
);
router.post(
  "/applications/offers/:invitationId/respond",
  authUser,
  upload.none(),
  jobsController.respondToJobInvitation
);
router.get("/applications/:applicationId", authUser, jobsController.getMyApplicationDetails);
router.post(
  "/applications/:applicationId/messages",
  authUser,
  upload.none(),
  jobsController.addApplicationMessage
);
router.patch(
  "/applications/:applicationId/cancel",
  authUser,
  upload.none(),
  jobsController.cancelMyApplication
);
router.post(
  "/applications/:applicationId/cancel",
  authUser,
  upload.none(),
  jobsController.cancelMyApplication
);

/* Companies */
router.get("/companies", authUser, companiesController.browseCompanies);
router.get("/companies/activity", authUser, companiesController.companiesFromMyActivity);
router.get("/companies/applied", authUser, companiesController.companiesIAppliedTo);
router.get("/companies/saved-jobs", authUser, companiesController.companiesFromSavedJobs);
router.get("/companies/viewed", authUser, companiesController.companiesViewedByMe);
router.get("/companies/:companyId", authUser, companiesController.companyDetails);
router.post(
  "/companies/:companyId/review",
  authUser,
  upload.none(),
  companiesController.reviewCompany
);

export default router;
