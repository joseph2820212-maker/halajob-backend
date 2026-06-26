import express from "express";
import employeeDashRoutes from "./employeeDashRoutes.js";
import authRoute from "./authRoute.js";
import informationHelperRoute from "./informationHelperRoute.js";
import cvRoute from "./cvRoute.js";
import legacyMobileRoute from "./legacyMobileRoute.js";
import { authUser } from "../middlewares/userAuth.js";
import { requireAppAccount } from "../middlewares/appAccountGuard.js";

const router = express.Router();
const employeeAccountGuard = [authUser, requireAppAccount("employee")];

router.use("/auth", authRoute);
router.use("/global", employeeAccountGuard, employeeDashRoutes);
router.use("/cv", employeeAccountGuard, cvRoute);
router.use("/helper", employeeAccountGuard, informationHelperRoute);
router.use("/", legacyMobileRoute);

export default router;
