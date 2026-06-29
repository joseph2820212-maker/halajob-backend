import express from "express";
import SalaryInsightsController from "../controllers/salaryInsights/SalaryInsightsController.js";

const router = express.Router();

router.get("/", SalaryInsightsController.publicInsight);
router.get("/:titleSlug", SalaryInsightsController.publicInsightByTitle);

export default router;
