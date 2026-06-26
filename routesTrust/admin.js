import express from "express";
import { isAdmin } from "../middlewares/isAdmin.js";
import TrustAdminController from "../controllers/trust/TrustAdminController.js";
import multer from "../utils/multer.js";

const router = express.Router();
const upload = multer;

router.use(isAdmin);

router.get("/review-queue", TrustAdminController.reviewQueue);
router.post("/jobs/:jobId/mark-safe", upload.none(), TrustAdminController.markJobSafe);
router.patch("/jobs/:jobId/mark-safe", upload.none(), TrustAdminController.markJobSafe);
router.post("/jobs/:jobId/suspend", upload.none(), TrustAdminController.suspendJob);
router.patch("/jobs/:jobId/suspend", upload.none(), TrustAdminController.suspendJob);
router.post("/jobs/:jobId/request-documents", upload.none(), TrustAdminController.requestDocuments);
router.patch("/jobs/:jobId/request-documents", upload.none(), TrustAdminController.requestDocuments);

export default router;
