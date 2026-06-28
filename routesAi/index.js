import express from "express";
import { authUser } from "../middlewares/userAuth.js";
import { requireAppAccount } from "../middlewares/appAccountGuard.js";
import CareerPassportController from "../controllers/app/CareerPassport/CareerPassportController.js";
import AiSafetyController from "../controllers/ai/AiSafetyController.js";
import validate from "../middlewares/validate.js";
import platformSchemas from "../validations/platform.validation.js";

const router = express.Router();

router.use(express.json({ limit: "1mb" }));

router.post(
  "/career-passport/score",
  authUser,
  requireAppAccount("employee"),
  validate(platformSchemas.aiRequestSchema),
  CareerPassportController.refreshScore
);

router.post("/career/copilot", authUser, requireAppAccount("employee"), validate(platformSchemas.aiRequestSchema), AiSafetyController.careerCopilot);
router.post("/profile/score", authUser, requireAppAccount("employee"), validate(platformSchemas.aiRequestSchema), AiSafetyController.profileScore);
router.post("/cv/rewrite", authUser, requireAppAccount("employee"), validate(platformSchemas.aiRequestSchema), AiSafetyController.cvRewrite);
router.post("/jobs/:jobId/match", authUser, requireAppAccount("employee"), validate(platformSchemas.aiJobRequestSchema), AiSafetyController.jobMatch);
router.post("/jobs/:jobId/cover-letter", authUser, requireAppAccount("employee"), validate(platformSchemas.aiJobRequestSchema), AiSafetyController.coverLetter);
router.post("/interview/practice", authUser, requireAppAccount("employee"), validate(platformSchemas.aiRequestSchema), AiSafetyController.interviewPractice);

router.post("/company/jobs/generate", authUser, requireAppAccount("company"), validate(platformSchemas.aiRequestSchema), AiSafetyController.companyJobGenerate);
router.post("/company/jobs/:jobId/shortlist", authUser, requireAppAccount("company"), validate(platformSchemas.aiJobRequestSchema), AiSafetyController.companyShortlist);
router.post("/company/messages/generate", authUser, requireAppAccount("company"), validate(platformSchemas.aiRequestSchema), AiSafetyController.companyMessageGenerate);

router.post("/translate/job/:jobId", authUser, requireAppAccount("company"), validate(platformSchemas.aiJobRequestSchema), AiSafetyController.translateJob);
router.post("/translate/cv", authUser, requireAppAccount("employee"), validate(platformSchemas.aiRequestSchema), AiSafetyController.translateCv);

export default router;
