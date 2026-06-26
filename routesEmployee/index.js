import express from "express";
import employeeDashRoutes from "./employeeDashRoutes.js";
import authRoute from "./authRoute.js";
import informationHelperRoute from "./informationHelperRoute.js";
import cvRoute from "./cvRoute.js";
import legacyMobileRoute from "./legacyMobileRoute.js";
import { authUser } from "../middlewares/userAuth.js";

const router = express.Router();

router.use("/auth", authRoute);
router.use("/global", authUser, employeeDashRoutes);
router.use("/cv", authUser, cvRoute);
router.use("/helper", authUser, informationHelperRoute);
router.use("/", legacyMobileRoute);

export default router;
