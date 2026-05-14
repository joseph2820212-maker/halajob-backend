import express from "express";

import controllers from "../controllers/dash/cvTemplateController.js";


import { authMiddleware } from "../../../middlewares/authMiddleware.js";

const router = express.Router();

// Admin
router.post("/admin/cv-templates", authMiddleware, controllers.createCvTemplate);
router.put("/admin/cv-templates/:id", authMiddleware, controllers.updateCvTemplate);
router.get("/admin/cv-templates", authMiddleware, controllers.getCvTemplatesAdmin);
router.get("/admin/cv-templates/:id", authMiddleware, controllers.getCvTemplateById);


export default router;