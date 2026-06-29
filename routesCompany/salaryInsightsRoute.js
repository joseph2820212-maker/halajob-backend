import express from "express";
import validate from "../middlewares/validate.js";
import companySchemas from "../validations/company.validation.js";
import SalaryInsightsController from "../controllers/salaryInsights/SalaryInsightsController.js";

const router = express.Router();

router.post(
  "/check",
  express.json(),
  validate(companySchemas.salaryInsightCheckSchema),
  SalaryInsightsController.companyCheck,
);
router.get(
  "/suggest",
  validate(companySchemas.salaryInsightSuggestSchema),
  SalaryInsightsController.companySuggest,
);

export default router;
