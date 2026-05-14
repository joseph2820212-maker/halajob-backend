import express from "express";
import generateCvController from "../controllers/employeeDash/cv/generateCvController.js";
import uploadCvController from "../controllers/employeeDash/cv/uploadCvController.js";
import multerCv from "../utils/multerCv.js";

const cvUpload = multerCv;
const router = express.Router();

router.post(
 "/upload",
 cvUpload.single("cv"),
 uploadCvController.uploadMyCv
);
router.put(
 "/upload/:cvId",
 uploadCvController.setActiveCv
);

router.get(
 "/uploaded",
 uploadCvController.getMyUploadedCvs
);

router.delete(
 "/uploaded/:cvId",
 uploadCvController.deleteMyUploadedCv
);
router.post("/generate/preview", generateCvController.previewMyCv);
router.post("/generate/download", generateCvController.downloadMyCv);
router.post("/generate/download-url", generateCvController.createMyCvDownloadUrl);
router.get("/download/:cvId", generateCvController.downloadSavedCv);
router.post("/generate/save", generateCvController.saveMyCvSettings);
router.get("/generate/templates", generateCvController.getCvTemplatesPublic);
export default router;
