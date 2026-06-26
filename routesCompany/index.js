import express from "express";
import companyDashRoutes from "./companyDashRoutes.js";
import authRoute from "./authRoute.js";
import informationHelperRoute from "./informationHelperRoute.js";
import jobRoute from "./jobRoute.js";
import campusRoute from "./campusRoute.js";

import { authUser } from "../middlewares/userAuth.js";
import { requireCompanyContext } from "../middlewares/appAccountGuard.js";

const router = express.Router();

router.use("/auth", authRoute);
router.use("/global", authUser, requireCompanyContext, companyDashRoutes);
router.use("/helper", authUser, requireCompanyContext, informationHelperRoute);
router.use("/jobs", authUser, requireCompanyContext, jobRoute);
router.use("/campus", authUser, requireCompanyContext, campusRoute);


export default router;
