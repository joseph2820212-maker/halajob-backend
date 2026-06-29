import express from "express";
import { authUser } from "../middlewares/userAuth.js";
import validate from "../middlewares/validate.js";
import seekerSchemas from "../validations/seeker.validation.js";
import SalaryInsightsController from "../controllers/salaryInsights/SalaryInsightsController.js";

const router = express.Router();

router.use(authUser);

router.get("/", validate(seekerSchemas.salaryInsightQuerySchema), SalaryInsightsController.userInsight);
router.get(
  "/jobs/:jobId",
  validate(seekerSchemas.salaryInsightJobSchema),
  SalaryInsightsController.userJobInsight,
);

export default router;
