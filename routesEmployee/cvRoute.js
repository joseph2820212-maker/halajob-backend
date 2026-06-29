import express from "express";
import generateCvController from "../controllers/employeeDash/cv/generateCvController.js";
import uploadCvController from "../controllers/employeeDash/cv/uploadCvController.js";
import cvStudioController from "../controllers/employeeDash/cv/cvStudioController.js";
import validate from "../middlewares/validate.js";
import seekerSchemas from "../validations/seeker.validation.js";
import multerCv from "../utils/multerCv.js";

const cvUpload = multerCv;
const router = express.Router();

router.post(
 "/upload",
 cvUpload.single("cv"),
 validate(seekerSchemas.cvUploadSchema),
 uploadCvController.uploadMyCv
);
router.put(
 "/upload/:cvId",
 validate(seekerSchemas.cvIdSchema),
 uploadCvController.setActiveCv
);

router.get(
 "/uploaded",
 uploadCvController.getMyUploadedCvs
);

router.delete(
 "/uploaded/:cvId",
 validate(seekerSchemas.cvIdSchema),
 uploadCvController.deleteMyUploadedCv
);
router.post(
 "/parse/upload",
 cvUpload.single("cv"),
 validate(seekerSchemas.cvParseUploadSchema),
 cvStudioController.parseUpload
);
router.get(
 "/parse/jobs/:jobId",
 validate(seekerSchemas.cvParseJobSchema),
 cvStudioController.getParseJob
);
router.get(
 "/parse/jobs/:jobId/preview",
 validate(seekerSchemas.cvParseJobSchema),
 cvStudioController.previewParseJob
);
router.post(
 "/parse/jobs/:jobId/confirm",
 validate(seekerSchemas.cvParseJobActionSchema),
 cvStudioController.confirmParseJob
);
router.post(
 "/parse/jobs/:jobId/reject",
 validate(seekerSchemas.cvParseJobActionSchema),
 cvStudioController.rejectParseJob
);
router.post(
 "/:cvId/quality-score",
 validate(seekerSchemas.cvIdSchema),
 cvStudioController.scoreCvQuality
);
router.post(
 "/:cvId/duplicate",
 validate(seekerSchemas.cvDuplicateSchema),
 cvStudioController.duplicateCv
);
router.patch(
 "/:cvId/visibility",
 validate(seekerSchemas.cvVisibilitySchema),
 cvStudioController.updateVisibility
);
router.post(
 "/:cvId/set-default",
 validate(seekerSchemas.cvIdSchema),
 cvStudioController.setDefaultCv
);
router.get(
 "/:cvId/cover-letter/templates",
 validate(seekerSchemas.cvIdSchema),
 cvStudioController.getCoverLetterTemplates
);
router.post(
 "/:cvId/cover-letter/preview",
 validate(seekerSchemas.cvCoverLetterSchema),
 cvStudioController.previewCoverLetter
);
router.post(
 "/:cvId/cover-letter/download",
 validate(seekerSchemas.cvCoverLetterSchema),
 cvStudioController.downloadCoverLetter
);
router.post("/generate/preview", validate(seekerSchemas.cvGenerateSchema), generateCvController.previewMyCv);
router.post("/generate/download", validate(seekerSchemas.cvGenerateSchema), generateCvController.downloadMyCv);
router.post("/generate/download-url", validate(seekerSchemas.cvGenerateSchema), generateCvController.createMyCvDownloadUrl);
router.get("/download/:cvId", generateCvController.downloadSavedCv);
router.post("/generate/save", validate(seekerSchemas.cvGenerateSchema), generateCvController.saveMyCvSettings);
router.get("/generate/templates", generateCvController.getCvTemplatesPublic);
export default router;
