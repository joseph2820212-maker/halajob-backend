import express from "express";
import AppHelperController from "../controllers/app/Helper/AppHelperController.js";

const router = express.Router();

/*
  Public helper endpoints for the mobile app.
  Notes:
  - Supports search, q, keyword, title, name query params.
  - Empty search returns a safe default list instead of throwing an error.
  - Supports lan: ar/en header.
*/

/* ----------------------------- Job helpers ----------------------------- */
router.get("/job-name", AppHelperController.jobName);
router.get("/job-search", AppHelperController.jobName);
router.get("/job-names", AppHelperController.jobName);

router.get("/job-salary", AppHelperController.jobSalary);
router.get("/job-salary-get", AppHelperController.jobSalary);
router.get("/job-salaries", AppHelperController.jobSalary);
router.get("/salaries", AppHelperController.jobSalary);

router.get("/job-service", AppHelperController.jobService);
router.get("/job-service-get", AppHelperController.jobService);
router.get("/job-services", AppHelperController.jobService);
router.get("/services", AppHelperController.jobService);

router.get("/job-type", AppHelperController.jobType);
router.get("/job-type-get", AppHelperController.jobType);
router.get("/job-types", AppHelperController.jobType);

router.get("/job-location", AppHelperController.jobLocation);
router.get("/job-location-get", AppHelperController.jobLocation);
router.get("/work-location", AppHelperController.jobLocation);
router.get("/work-locations", AppHelperController.jobLocation);

router.get("/job-time", AppHelperController.jobTime);
router.get("/job-time-get", AppHelperController.jobTime);
router.get("/work-time", AppHelperController.jobTime);
router.get("/work-times", AppHelperController.jobTime);

router.get("/work-mode", AppHelperController.workMode);
router.get("/work-modes", AppHelperController.workMode);

/* ----------------------------- Profile/taxonomy helpers ----------------------------- */
router.get("/language", AppHelperController.language);
router.get("/languages", AppHelperController.language);
router.get("/language-search", AppHelperController.language);

router.get("/skill", AppHelperController.skill);
router.get("/skills", AppHelperController.skill);
router.get("/skill-search", AppHelperController.skill);

router.get("/education-level", AppHelperController.educationLevel);
router.get("/education-levels", AppHelperController.educationLevel);

router.get("/experience-level", AppHelperController.experienceLevel);
router.get("/experience-levels", AppHelperController.experienceLevel);

router.get("/industry", AppHelperController.industry);
router.get("/industries", AppHelperController.industry);

/* ----------------------------- Location/currency helpers ----------------------------- */
router.get("/currency-search", AppHelperController.currency);
router.get("/currency-get", AppHelperController.currency);
router.get("/currency", AppHelperController.currency);
router.get("/currencies", AppHelperController.currency);

router.get("/country-search", AppHelperController.country);
router.get("/country-get", AppHelperController.country);
router.get("/country", AppHelperController.country);
router.get("/countries", AppHelperController.country);
router.get("/city-search", AppHelperController.country);
router.get("/cities", AppHelperController.country);

export default router;
