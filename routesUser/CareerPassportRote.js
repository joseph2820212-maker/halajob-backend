import express from "express";
import { authUser } from "../middlewares/userAuth.js";
import { requireAppAccount } from "../middlewares/appAccountGuard.js";
import CareerPassportController from "../controllers/app/CareerPassport/CareerPassportController.js";

const router = express.Router();

router.get("/share/:token", CareerPassportController.shared);
router.get("/", authUser, requireAppAccount("employee"), CareerPassportController.get);
router.put("/", authUser, requireAppAccount("employee"), express.json(), CareerPassportController.update);
router.post("/share", authUser, requireAppAccount("employee"), express.json(), CareerPassportController.share);

export default router;
