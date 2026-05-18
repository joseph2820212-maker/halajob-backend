import express from "express";
import controller from "../controllers/employeeDash/information/informationHelperController.js";
import controllerApp from "../controllers/app/Helper/JobNameHelperController.js";
import multer from "../utils/multer.js";

const upload = multer;
const router = express.Router();


router.get("/languages", upload.none(), controller.getLanguages);
router.get("/job-types", upload.none(), controller.getJobType);
router.get("/currencies", upload.none(), controller.getCurrencies);
router.get("/work-mode", upload.none(), controller.workMode);
router.get("/work-time", upload.none(), controller.workTime);
router.get("/cities", upload.none(), controller.cities);
router.get("/salaries", upload.none(), controller.salaryType);

router.get("/industry", upload.none(), controller.industry);

router.get("/job-name", upload.none(), controllerApp.search);
router.get("/experience-level", upload.none(), controller.experienceLevel);
router.get("/skills", upload.none(), controller.skills);
router.get("/education-level", upload.none(), controller.educationLevel);
router.get("/services", upload.none(), controller.services);

export default router;
