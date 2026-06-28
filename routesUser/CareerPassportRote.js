import express from "express";
import { authUser } from "../middlewares/userAuth.js";
import { requireAppAccount } from "../middlewares/appAccountGuard.js";
import validate from "../middlewares/validate.js";
import seekerSchemas from "../validations/seeker.validation.js";
import CareerPassportController from "../controllers/app/CareerPassport/CareerPassportController.js";

const router = express.Router();

router.get("/share/:token", CareerPassportController.shared);
router.get("/", authUser, requireAppAccount("employee"), validate(seekerSchemas.careerPassportSchema), CareerPassportController.get);
router.put("/", authUser, requireAppAccount("employee"), express.json(), validate(seekerSchemas.careerPassportSchema), CareerPassportController.update);
router.post("/share", authUser, requireAppAccount("employee"), express.json(), validate(seekerSchemas.careerPassportSchema), CareerPassportController.share);

export default router;
