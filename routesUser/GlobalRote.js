import express from "express";
import GlobalController from "../controllers/app/Global/GlobalController.js";

const router = express.Router();

router.get("/countries", GlobalController.countries);
router.get("/cities", GlobalController.countries);
router.get("/currencies", GlobalController.currencies);
router.get("/currency", GlobalController.currencies);
router.get("/work-modes", GlobalController.workModes);
router.get("/work-mode", GlobalController.workModes);

export default router;
