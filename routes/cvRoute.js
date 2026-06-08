import express from 'express';
import controllers from '../controllers/dash/cvTemplateController.js';

const router = express.Router();

router.post('/admin/cv-templates', controllers.createCvTemplate);
router.put('/admin/cv-templates/:id', controllers.updateCvTemplate);
router.patch('/admin/cv-templates/:id', controllers.updateCvTemplate);
router.get('/admin/cv-templates', controllers.getCvTemplatesAdmin);
router.get('/admin/cv-templates/:id', controllers.getCvTemplateById);
router.delete('/admin/cv-templates/:id', controllers.deleteCvTemplate);

router.post('/templates', controllers.createCvTemplate);
router.put('/templates/:id', controllers.updateCvTemplate);
router.patch('/templates/:id', controllers.updateCvTemplate);
router.get('/templates', controllers.getCvTemplatesAdmin);
router.get('/templates/:id', controllers.getCvTemplateById);
router.delete('/templates/:id', controllers.deleteCvTemplate);

export default router;
