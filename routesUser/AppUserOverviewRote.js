import express from "express";
import { authUser } from "../middlewares/userAuth.js";
import AppUserOverviewController from "../controllers/app/Dashboard/AppUserOverviewController.js";

const router = express.Router();

// Personal mobile app dashboard. User type is detected automatically from req.user.
router.get("/", authUser, AppUserOverviewController.getMyAppDashboardOverview);
router.get("/overview", authUser, AppUserOverviewController.getMyAppDashboardOverview);

export default router;
