import express from "express";
import jobsController from "../controllers/employeeDash/employeeWithJobs/employeeWithJobsController.js";
import companiesController from "../controllers/employeeDash/employeeWithCompanies/employeeWithCompaniesController.js";
import { authUser } from "../middlewares/userAuth.js";
import { requireAppAccount } from "../middlewares/appAccountGuard.js";
import validate from "../middlewares/validate.js";
import seekerSchemas from "../validations/seeker.validation.js";
import multer from "../utils/multer.js";

const upload = multer;
const router = express.Router();
const employeeAccountGuard = [authUser, requireAppAccount("employee")];

// Compatibility aliases for older mobile clients. The canonical routes remain
// under /employee/v1/global/* and /user/v1/*.

/* Jobs */
router.post("/jobs/:jobId/apply", employeeAccountGuard, upload.none(), validate(seekerSchemas.jobApplySchema), jobsController.applyToJob);
router.post("/jobs/:jobId/save", employeeAccountGuard, upload.none(), validate(seekerSchemas.jobBodySchema), jobsController.saveJob);
router.delete("/jobs/:jobId/save", employeeAccountGuard, upload.none(), validate(seekerSchemas.jobBodySchema), jobsController.unsaveJob);
router.post("/jobs/:jobId/rate", employeeAccountGuard, upload.none(), validate(seekerSchemas.jobRateSchema), jobsController.rateJob);
router.post("/jobs/:jobId/review", employeeAccountGuard, upload.none(), validate(seekerSchemas.jobReviewSchema), jobsController.reviewJob);

/* Applications */
router.get("/applications", employeeAccountGuard, jobsController.myApplications);
router.get("/applications/interviews", employeeAccountGuard, jobsController.myInterviews);
router.patch(
  "/applications/interviews/:interviewId/respond",
  employeeAccountGuard,
  upload.none(),
  validate(seekerSchemas.interviewResponseSchema),
  jobsController.respondToInterview
);
router.post(
  "/applications/interviews/:interviewId/respond",
  employeeAccountGuard,
  upload.none(),
  validate(seekerSchemas.interviewResponseSchema),
  jobsController.respondToInterview
);
router.get("/applications/offers", employeeAccountGuard, jobsController.myJobInvitations);
router.patch(
  "/applications/offers/:invitationId/respond",
  employeeAccountGuard,
  upload.none(),
  validate(seekerSchemas.invitationResponseSchema),
  jobsController.respondToJobInvitation
);
router.post(
  "/applications/offers/:invitationId/respond",
  employeeAccountGuard,
  upload.none(),
  validate(seekerSchemas.invitationResponseSchema),
  jobsController.respondToJobInvitation
);
router.get("/applications/:applicationId", employeeAccountGuard, jobsController.getMyApplicationDetails);
router.post(
  "/applications/:applicationId/messages",
  employeeAccountGuard,
  upload.none(),
  validate(seekerSchemas.applicationMessageSchema),
  jobsController.addApplicationMessage
);
router.patch(
  "/applications/:applicationId/cancel",
  employeeAccountGuard,
  upload.none(),
  validate(seekerSchemas.applicationCancelSchema),
  jobsController.cancelMyApplication
);
router.post(
  "/applications/:applicationId/cancel",
  employeeAccountGuard,
  upload.none(),
  validate(seekerSchemas.applicationCancelSchema),
  jobsController.cancelMyApplication
);

/* Companies */
router.get("/companies", employeeAccountGuard, companiesController.browseCompanies);
router.get("/companies/activity", employeeAccountGuard, companiesController.companiesFromMyActivity);
router.get("/companies/applied", employeeAccountGuard, companiesController.companiesIAppliedTo);
router.get("/companies/saved-jobs", employeeAccountGuard, companiesController.companiesFromSavedJobs);
router.get("/companies/viewed", employeeAccountGuard, companiesController.companiesViewedByMe);
router.get("/companies/:companyId", employeeAccountGuard, companiesController.companyDetails);
router.post(
  "/companies/:companyId/review",
  employeeAccountGuard,
  upload.none(),
  validate(seekerSchemas.companyReviewSchema),
  companiesController.reviewCompany
);

export default router;
