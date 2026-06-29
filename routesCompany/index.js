import express from "express";
import companyDashRoutes from "./companyDashRoutes.js";
import authRoute from "./authRoute.js";
import informationHelperRoute from "./informationHelperRoute.js";
import jobRoute from "./jobRoute.js";
import campusRoute from "./campusRoute.js";
import settingsRoute from "./settingsRoute.js";
import salaryInsightsRoute from "./salaryInsightsRoute.js";
import interviewRoute from "./interviewRoute.js";
import talentPoolRoute from "./talentPoolRoute.js";
import profileRoute from "./profileRoute.js";

import { authUser } from "../middlewares/userAuth.js";
import {
  requireAppAccount,
  requireCompanyContext,
} from "../middlewares/appAccountGuard.js";

const router = express.Router();
const approvedCompanyGuard = [
  authUser,
  requireCompanyContext,
  requireAppAccount("company"),
];

router.use("/auth", authRoute);
router.use("/global", approvedCompanyGuard, companyDashRoutes);
router.use("/settings", approvedCompanyGuard, settingsRoute);
router.use("/profile", approvedCompanyGuard, profileRoute);
router.use("/helper", approvedCompanyGuard, informationHelperRoute);
router.use("/jobs", approvedCompanyGuard, jobRoute);
router.use("/interviews", approvedCompanyGuard, interviewRoute);
router.use("/talent-pool", approvedCompanyGuard, talentPoolRoute);
router.use("/campus", approvedCompanyGuard, campusRoute);
router.use("/salary-insights", approvedCompanyGuard, salaryInsightsRoute);

export default router;
