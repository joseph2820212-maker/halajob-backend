import express from "express";
import campusController from "../controllers/app/campus/campusController.js";
import multer from "../utils/multer.js";

const router = express.Router();
const upload = multer;

router.get("/overview", campusController.universityOverview);
router.get("/opportunities", campusController.companyOpportunities);
router.post("/opportunities", upload.none(), campusController.createCompanyOpportunity);
router.get("/students", campusController.students);
router.get("/partners", campusController.partners);
router.post("/partners", upload.none(), campusController.addPartner);

export default router;
