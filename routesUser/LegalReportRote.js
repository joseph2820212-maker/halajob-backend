import express from "express";
import { authUser } from "../middlewares/userAuth.js";
import { optionalAuthUser } from "../middlewares/optionalAuthUser.js";
import validate from "../middlewares/validate.js";
import schemas from "../validations/userContent.validation.js";
import LegalReportController from "../controllers/app/Legal/LegalReportController.js";

const router = express.Router();

// Reports can be submitted by authenticated users or visitors (optional auth).
router.post("/", optionalAuthUser, express.json(), validate(schemas.legalReportSchema), LegalReportController.createReport);
router.get("/", authUser, LegalReportController.listMyReports);
router.get("/:id", authUser, LegalReportController.getReport);

export default router;
