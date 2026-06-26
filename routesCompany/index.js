import express from "express";
import companyDashRoutes from "./companyDashRoutes.js";
import authRoute from "./authRoute.js";
import informationHelperRoute from "./informationHelperRoute.js";
import jobRoute from "./jobRoute.js";
import campusRoute from "./campusRoute.js";

import { authUser } from "../middlewares/userAuth.js";
import { requireAppAccount, requireCompanyContext } from "../middlewares/appAccountGuard.js";

const router = express.Router();
const approvedCompanyGuard = [authUser, requireCompanyContext, requireAppAccount("company")];

router.use("/auth", authRoute);
router.use("/global", approvedCompanyGuard, companyDashRoutes);
router.use("/helper", approvedCompanyGuard, informationHelperRoute);
router.use("/jobs", approvedCompanyGuard, jobRoute);
router.use("/campus", approvedCompanyGuard, campusRoute);


export default router;
