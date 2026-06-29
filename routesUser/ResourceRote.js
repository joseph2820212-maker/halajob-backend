import express from "express";
import * as LearningResourceController from "../controllers/app/resources/LearningResourceController.js";
import { requireAppAccount } from "../middlewares/appAccountGuard.js";
import { authUser } from "../middlewares/userAuth.js";
import validate from "../middlewares/validate.js";
import resourceSchemas from "../validations/resource.validation.js";

const router = express.Router();
const seekerGuard = [authUser, requireAppAccount("employee")];

router.get(
  "/me/progress",
  seekerGuard,
  validate(resourceSchemas.resourceListSchema),
  LearningResourceController.myProgress,
);
router.get(
  "/recommended",
  seekerGuard,
  validate(resourceSchemas.resourceRecommendationSchema),
  LearningResourceController.recommendedResources,
);
router.get(
  "/",
  seekerGuard,
  validate(resourceSchemas.resourceListSchema),
  LearningResourceController.listResources,
);
router.get(
  "/:idOrSlug",
  seekerGuard,
  validate(resourceSchemas.resourceDetailSchema),
  LearningResourceController.getResource,
);
router.post(
  "/:id/save",
  seekerGuard,
  validate(resourceSchemas.resourceIdSchema),
  LearningResourceController.saveResource,
);
router.delete(
  "/:id/save",
  seekerGuard,
  validate(resourceSchemas.resourceIdSchema),
  LearningResourceController.unsaveResource,
);
router.patch(
  "/:id/progress",
  seekerGuard,
  validate(resourceSchemas.resourceProgressSchema),
  LearningResourceController.updateProgress,
);
router.post(
  "/:id/complete",
  seekerGuard,
  validate(resourceSchemas.resourceIdSchema),
  LearningResourceController.completeResource,
);

export default router;
