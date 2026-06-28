import express from "express";
import { authUser } from "../middlewares/userAuth.js";
import { requireAppAccount } from "../middlewares/appAccountGuard.js";
import validate from "../middlewares/validate.js";
import seekerSchemas from "../validations/seeker.validation.js";
import ApplyingJobController from "../controllers/app/JobData/ApplyingJobController.js";

const router = express.Router();

router.post("/insert/:id", authUser, requireAppAccount("employee"), validate(seekerSchemas.legacyJobApplySchema), ApplyingJobController.applyJob);
router.get("/get", authUser, requireAppAccount("employee"), ApplyingJobController.getAppliedJobs);
router.get("/readiness/:id", authUser, requireAppAccount("employee"), ApplyingJobController.getApplyReadiness);
export default router;
