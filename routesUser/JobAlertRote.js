import express from "express";
import * as SavedSearchController from "../controllers/app/jobAlerts/SavedSearchController.js";
import { requireAppAccount } from "../middlewares/appAccountGuard.js";
import { authUser } from "../middlewares/userAuth.js";
import validate from "../middlewares/validate.js";
import schemas from "../validations/savedSearch.validation.js";

const router = express.Router();
const seekerGuard = [authUser, requireAppAccount("employee")];

router.get("/logs", seekerGuard, validate(schemas.logsSchema), SavedSearchController.listAlertLogs);

export default router;
