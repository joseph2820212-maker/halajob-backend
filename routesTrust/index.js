import express from "express";
import { authUser } from "../middlewares/userAuth.js";
import { requireAppAccount } from "../middlewares/appAccountGuard.js";
import TrustController from "../controllers/trust/TrustController.js";
import multer from "../utils/multer.js";

const router = express.Router();
const upload = multer;

router.post(
  "/jobs/:jobId/score",
  authUser,
  requireAppAccount("employee"),
  upload.none(),
  TrustController.scoreJob
);

router.post(
  "/jobs/:jobId/report",
  authUser,
  requireAppAccount("employee"),
  upload.none(),
  TrustController.reportJob
);

export default router;
