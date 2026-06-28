import express from "express";
import { isAdmin } from "../middlewares/isAdmin.js";
import TrustAdminController from "../controllers/trust/TrustAdminController.js";
import multer from "../utils/multer.js";
import validate from "../middlewares/validate.js";
import platformSchemas from "../validations/platform.validation.js";

const router = express.Router();
const upload = multer;

router.use(isAdmin);

router.get("/review-queue", TrustAdminController.reviewQueue);
router.post("/jobs/:jobId/mark-safe", upload.none(), validate(platformSchemas.trustAdminActionSchema), TrustAdminController.markJobSafe);
router.patch("/jobs/:jobId/mark-safe", upload.none(), validate(platformSchemas.trustAdminActionSchema), TrustAdminController.markJobSafe);
router.post("/jobs/:jobId/suspend", upload.none(), validate(platformSchemas.trustAdminActionSchema), TrustAdminController.suspendJob);
router.patch("/jobs/:jobId/suspend", upload.none(), validate(platformSchemas.trustAdminActionSchema), TrustAdminController.suspendJob);
router.post("/jobs/:jobId/request-documents", upload.none(), validate(platformSchemas.trustAdminActionSchema), TrustAdminController.requestDocuments);
router.patch("/jobs/:jobId/request-documents", upload.none(), validate(platformSchemas.trustAdminActionSchema), TrustAdminController.requestDocuments);

export default router;
