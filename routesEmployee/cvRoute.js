import express from "express";
import generateCvController from "../controllers/employeeDash/cv/generateCvController.js";
import uploadCvController from "../controllers/employeeDash/cv/uploadCvController.js";
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
router.post("/generate/preview", validate(seekerSchemas.cvGenerateSchema), generateCvController.previewMyCv);
router.post("/generate/download", validate(seekerSchemas.cvGenerateSchema), generateCvController.downloadMyCv);
router.post("/generate/download-url", validate(seekerSchemas.cvGenerateSchema), generateCvController.createMyCvDownloadUrl);
router.get("/download/:cvId", generateCvController.downloadSavedCv);
router.post("/generate/save", validate(seekerSchemas.cvGenerateSchema), generateCvController.saveMyCvSettings);
router.get("/generate/templates", generateCvController.getCvTemplatesPublic);
export default router;
