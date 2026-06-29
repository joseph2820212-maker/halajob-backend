import express from "express";
import controllerHiring from "../controllers/companyDash/companyWithJobs/companyJobHiringController.js";
import { requireCompanyPermission } from "../helper/companyDash/companyDashHelpers.js";
import validate from "../middlewares/validate.js";
import companySchemas from "../validations/company.validation.js";
import multer from "../utils/multer.js";

const upload = multer;
const router = express.Router();

router.get("/", requireCompanyPermission("ats.view"), upload.none(), validate(companySchemas.listSchema), controllerHiring.getInterviews);
router.post("/", requireCompanyPermission("ats.interviews.schedule"), upload.none(), validate(companySchemas.interviewCreateSchema), controllerHiring.createInterview);
router.get("/:interviewId", requireCompanyPermission("ats.view"), upload.none(), validate(companySchemas.interviewBodySchema), controllerHiring.getInterviewDetails);
router.patch("/:interviewId", requireCompanyPermission("ats.interviews.schedule"), upload.none(), validate(companySchemas.interviewBodySchema), controllerHiring.updateInterview);
router.patch("/:interviewId/status", requireCompanyPermission("ats.interviews.schedule"), upload.none(), validate(companySchemas.interviewBodySchema), controllerHiring.changeInterviewStatus);
router.post("/:interviewId/cancel", requireCompanyPermission("ats.interviews.schedule"), upload.none(), validate(companySchemas.interviewBodySchema), controllerHiring.cancelInterview);
router.post("/:interviewId/feedback", requireCompanyPermission("ats.interviews.schedule"), upload.none(), validate(companySchemas.interviewFeedbackSchema), controllerHiring.submitInterviewFeedback);
router.post("/:interviewId/mark-no-show", requireCompanyPermission("ats.interviews.schedule"), upload.none(), validate(companySchemas.interviewBodySchema), controllerHiring.markInterviewNoShow);
router.post("/:interviewId/send-reminder", requireCompanyPermission("ats.interviews.schedule"), upload.none(), validate(companySchemas.interviewReminderSchema), controllerHiring.sendInterviewReminder);

export default router;
