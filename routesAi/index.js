import express from "express";
import { authUser } from "../middlewares/userAuth.js";
import { requireAppAccount } from "../middlewares/appAccountGuard.js";
import CareerPassportController from "../controllers/app/CareerPassport/CareerPassportController.js";

const router = express.Router();

router.post(
  "/career-passport/score",
  authUser,
  requireAppAccount("employee"),
  express.json(),
  CareerPassportController.refreshScore
);

export default router;
