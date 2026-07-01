import express from "express";
import controller from "../controllers/employeeDash/information/informationHelperController.js";
import controllerApp from "../controllers/app/Helper/JobNameHelperController.js";
import multer from "../utils/multer.js";

const upload = multer;
const router = express.Router();


// Wave 7a (cleanup): removed 8 legacy helper endpoints that have /user/v1/helper/*
// equivalents and zero client callers (verified across halajob-website,
// halajob-admin, halajob-mobile). Kept the 5 endpoints the mobile app is still
// pointing at until its next release repoints to /user/v1/helper/*.
router.get("/languages", upload.none(), controller.getLanguages);
router.get("/job-types", upload.none(), controller.getJobType);
router.get("/work-mode", upload.none(), controller.workMode);
router.get("/work-time", upload.none(), controller.workTime);
router.get("/cities", upload.none(), controller.cities);
// Removed (no client hits, /user/v1/helper equivalents exist):
//   router.get("/currencies",       upload.none(), controller.getCurrencies);
//   router.get("/salaries",         upload.none(), controller.salaryType);
//   router.get("/industry",         upload.none(), controller.industry);
//   router.get("/job-name",         upload.none(), controllerApp.search);
//   router.get("/experience-level", upload.none(), controller.experienceLevel);
//   router.get("/skills",           upload.none(), controller.skills);
//   router.get("/education-level",  upload.none(), controller.educationLevel);
//   router.get("/services",         upload.none(), controller.services);

export default router;
