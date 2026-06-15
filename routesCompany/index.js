import express from "express";
import companyDashRoutes from "./companyDashRoutes.js";
import authRoute from "./authRoute.js";
import informationHelperRoute from "./informationHelperRoute.js";
import jobRoute from "./jobRoute.js";
import campusRoute from "./campusRoute.js";

import { authUser } from "../middlewares/userAuth.js";

const router = express.Router();

router.use("/auth", authRoute);
router.use("/global", authUser, companyDashRoutes);
router.use("/helper", authUser, informationHelperRoute);
router.use("/jobs", authUser, jobRoute);
router.use("/campus", authUser, campusRoute);


export default router;
