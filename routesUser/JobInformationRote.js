import express from "express";
import { authUser } from "../middlewares/userAuth.js";
import JobInformationController from "../controllers/app/JobData/JobInformation.js";

const router = express.Router();

router.post("/review-job/:id", authUser, JobInformationController.reviewJob);
router.post("/report-job/:id", authUser, JobInformationController.reportJob);
router.post("/rate-job/:id", authUser, JobInformationController.rateJob);
router.post("/apply-outside/:id", authUser, JobInformationController.applyOutsideJob);
router.post("/toggle-save-job/:id", authUser, JobInformationController.toggleSaveJob);
router.get("/list-job-reviews/:id", JobInformationController.listJobReviews);
router.get("/recompute-job-rating-breakdown/:id", authUser, JobInformationController.recomputeJobRatingBreakdown);
router.get("/list-job-savers/:id", authUser, JobInformationController.listJobSavers);

export default router;
