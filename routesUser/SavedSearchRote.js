import express from "express";
import * as SavedSearchController from "../controllers/app/jobAlerts/SavedSearchController.js";
import { requireAppAccount } from "../middlewares/appAccountGuard.js";
import { authUser } from "../middlewares/userAuth.js";
import validate from "../middlewares/validate.js";
import schemas from "../validations/savedSearch.validation.js";

const router = express.Router();
const seekerGuard = [authUser, requireAppAccount("employee")];

router.get("/", seekerGuard, validate(schemas.listSchema), SavedSearchController.listSavedSearches);
router.post("/", seekerGuard, validate(schemas.createSchema), SavedSearchController.createSavedSearch);
router.post(
  "/:id/run-now",
  seekerGuard,
  validate(schemas.runNowSchema),
  SavedSearchController.runSavedSearchNow,
);
router.get("/:id", seekerGuard, validate(schemas.idSchema), SavedSearchController.getSavedSearch);
router.patch("/:id", seekerGuard, validate(schemas.updateSchema), SavedSearchController.updateSavedSearch);
router.delete("/:id", seekerGuard, validate(schemas.idSchema), SavedSearchController.deleteSavedSearch);

export default router;
