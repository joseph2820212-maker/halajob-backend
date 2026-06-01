import express from "express";
import { authUser } from "../middlewares/userAuth.js";
import { requireAppAccount } from "../middlewares/appAccountGuard.js";
import ApplyingJobController from "../controllers/app/JobData/ApplyingJobController.js";

const router = express.Router();

router.post("/insert/:id", authUser, requireAppAccount("employee"), ApplyingJobController.applyJob);
router.get("/get", authUser, requireAppAccount("employee"), ApplyingJobController.getAppliedJobs);
router.get("/readiness/:id", authUser, requireAppAccount("employee"), ApplyingJobController.getApplyReadiness);
export default router;
