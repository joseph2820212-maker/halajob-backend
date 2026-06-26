import express from "express";
import { authUser } from "../middlewares/userAuth.js";
import { requireAppAccount } from "../middlewares/appAccountGuard.js";
import CareerPassportController from "../controllers/app/CareerPassport/CareerPassportController.js";
import AiSafetyController from "../controllers/ai/AiSafetyController.js";

const router = express.Router();

router.use(express.json({ limit: "1mb" }));

router.post(
  "/career-passport/score",
  authUser,
  requireAppAccount("employee"),
  CareerPassportController.refreshScore
);

router.post("/career/copilot", authUser, requireAppAccount("employee"), AiSafetyController.careerCopilot);
router.post("/profile/score", authUser, requireAppAccount("employee"), AiSafetyController.profileScore);
router.post("/cv/rewrite", authUser, requireAppAccount("employee"), AiSafetyController.cvRewrite);
router.post("/jobs/:jobId/match", authUser, requireAppAccount("employee"), AiSafetyController.jobMatch);
router.post("/jobs/:jobId/cover-letter", authUser, requireAppAccount("employee"), AiSafetyController.coverLetter);
router.post("/interview/practice", authUser, requireAppAccount("employee"), AiSafetyController.interviewPractice);

router.post("/company/jobs/generate", authUser, requireAppAccount("company"), AiSafetyController.companyJobGenerate);
router.post("/company/jobs/:jobId/shortlist", authUser, requireAppAccount("company"), AiSafetyController.companyShortlist);
router.post("/company/messages/generate", authUser, requireAppAccount("company"), AiSafetyController.companyMessageGenerate);

router.post("/translate/job/:jobId", authUser, requireAppAccount("company"), AiSafetyController.translateJob);
router.post("/translate/cv", authUser, requireAppAccount("employee"), AiSafetyController.translateCv);

export default router;
