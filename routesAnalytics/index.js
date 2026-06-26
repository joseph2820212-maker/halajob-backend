import express from "express";
import { authUser } from "../middlewares/userAuth.js";
import AnalyticsController from "../controllers/analytics/AnalyticsController.js";

const router = express.Router();

router.use(authUser);

router.post("/events", AnalyticsController.track);
router.post("/track", AnalyticsController.track);
router.get("/events", AnalyticsController.listMine);

export default router;
