import express from "express";
import { authUser } from "../middlewares/userAuth.js";
import { requireAppAccount } from "../middlewares/appAccountGuard.js";
import JobInformationController from "../controllers/app/JobData/JobInformation.js";

const router = express.Router();

router.post("/review-job/:id", authUser, requireAppAccount("employee"), JobInformationController.reviewJob);
router.post("/report-job/:id", authUser, requireAppAccount("employee"), JobInformationController.reportJob);
router.post("/rate-job/:id", authUser, requireAppAccount("employee"), JobInformationController.rateJob);
router.post("/apply-outside/:id", authUser, requireAppAccount("employee"), JobInformationController.applyOutsideJob);
router.post("/toggle-save-job/:id", authUser, requireAppAccount("employee"), JobInformationController.toggleSaveJob);
router.get("/list-job-reviews/:id", JobInformationController.listJobReviews);
router.get("/recompute-job-rating-breakdown/:id", authUser, requireAppAccount("company"), JobInformationController.recomputeJobRatingBreakdown);
router.get("/list-job-savers/:id", authUser, requireAppAccount("company"), JobInformationController.listJobSavers);

export default router;
