import express from "express";
import { authUser } from "../middlewares/userAuth.js";
import AnalyticsController from "../controllers/analytics/AnalyticsController.js";
import validate from "../middlewares/validate.js";
import platformSchemas from "../validations/platform.validation.js";

const router = express.Router();

router.use(authUser);

router.post("/events", validate(platformSchemas.analyticsTrackSchema), AnalyticsController.track);
router.post("/track", validate(platformSchemas.analyticsTrackSchema), AnalyticsController.track);
router.get("/events", AnalyticsController.listMine);
router.get("/admin/summary", AnalyticsController.adminSummary);
router.get("/admin/cohorts", AnalyticsController.adminCohorts);

export default router;
