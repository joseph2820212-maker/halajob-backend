import express from "express";
import * as InterviewPrepController from "../controllers/app/interviewPrep/InterviewPrepController.js";
import { requireAppAccount } from "../middlewares/appAccountGuard.js";
import { authUser } from "../middlewares/userAuth.js";
import validate from "../middlewares/validate.js";
import schemas from "../validations/interviewPrep.validation.js";

const router = express.Router();
const seekerGuard = [authUser, requireAppAccount("employee")];

router.get("/", seekerGuard, validate(schemas.listSchema), InterviewPrepController.overview);
router.get("/questions", seekerGuard, validate(schemas.listSchema), InterviewPrepController.questions);
router.get("/jobs/:jobId", seekerGuard, validate(schemas.jobPrepSchema), InterviewPrepController.jobPrep);
router.post(
  "/questions/:id/save-note",
  seekerGuard,
  validate(schemas.saveNoteSchema),
  InterviewPrepController.saveQuestionNote,
);
router.patch(
  "/checklists/:id/progress",
  seekerGuard,
  validate(schemas.checklistProgressSchema),
  InterviewPrepController.updateChecklistProgress,
);

export default router;
