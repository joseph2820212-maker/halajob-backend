import express from "express";
import { authUser } from "../middlewares/userAuth.js";
import { requireAppAccount } from "../middlewares/appAccountGuard.js";
import CareerPassportController from "../controllers/app/CareerPassport/CareerPassportController.js";
import AiSafetyController from "../controllers/ai/AiSafetyController.js";
import validate from "../middlewares/validate.js";
import platformSchemas from "../validations/platform.validation.js";

const router = express.Router();

router.use(express.json({ limit: "1mb" }));

// Career Passport scoring degrades to a rule-based result when no AI provider is
// configured, so it stays available regardless of the AI feature flag.
router.post(
  "/career-passport/score",
  authUser,
  requireAppAccount("employee"),
  validate(platformSchemas.aiRequestSchema),
  CareerPassportController.refreshScore
);

// The AI runtime kill-switch lives in AiSafetyController: when no AI provider /
// usage limit is configured these endpoints return a graceful 503
// (ai_status.reason = "ai_feature_not_enabled") and record a blocked AiRequest +
// audit log. That is the server-side gate for the Syria-first launch (ship with
// no provider configured), so no extra route-level feature middleware is needed.
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
