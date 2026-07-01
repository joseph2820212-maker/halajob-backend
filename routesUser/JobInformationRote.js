import express from "express";
import { authUser } from "../middlewares/userAuth.js";
import { requireAppAccount } from "../middlewares/appAccountGuard.js";
import validate from "../middlewares/validate.js";
import seekerSchemas from "../validations/seeker.validation.js";
import JobInformationController from "../controllers/app/JobData/JobInformation.js";

const router = express.Router();

router.post("/review-job/:id", authUser, requireAppAccount("employee"), validate(seekerSchemas.legacyJobReviewSchema), JobInformationController.reviewJob);
router.post("/report-job/:id", authUser, requireAppAccount("employee"), validate(seekerSchemas.legacyJobReviewSchema), JobInformationController.reportJob);
router.post("/rate-job/:id", authUser, requireAppAccount("employee"), validate(seekerSchemas.legacyJobRateSchema), JobInformationController.rateJob);
router.post("/apply-outside/:id", authUser, requireAppAccount("employee"), validate(seekerSchemas.legacyJobBodySchema), JobInformationController.applyOutsideJob);
router.post("/toggle-save-job/:id", authUser, requireAppAccount("employee"), validate(seekerSchemas.legacyJobBodySchema), JobInformationController.toggleSaveJob);
router.get("/list-job-reviews/:id", JobInformationController.listJobReviews);
// Recomputing the rating breakdown writes updateOne to the job document.
// Moved from GET to POST so browser prefetch/crawlers can't trigger writes.
// GET returns 410 for one release cycle to surface stale admin/CRM callers.
router.post("/recompute-job-rating-breakdown/:id", authUser, requireAppAccount("company"), JobInformationController.recomputeJobRatingBreakdown);
router.get("/recompute-job-rating-breakdown/:id", (_req, res) =>
  res.status(410).json({
    success: false,
    message: "gone",
    hint: "POST /user/v1/job-information/recompute-job-rating-breakdown/:id (moved because the operation writes to the job document).",
  }),
);
router.get("/list-job-savers/:id", authUser, requireAppAccount("company"), JobInformationController.listJobSavers);

export default router;
