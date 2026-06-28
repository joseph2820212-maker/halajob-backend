import express from 'express';
import controllers from '../controllers/dash/cvTemplateController.js';
import validate from '../middlewares/validate.js';
import adminSchemas from '../validations/admin.validation.js';

const router = express.Router();

router.post('/admin/cv-templates', validate(adminSchemas.cvTemplateCreateSchema), controllers.createCvTemplate);
router.put('/admin/cv-templates/:id', validate(adminSchemas.cvTemplateUpdateSchema), controllers.updateCvTemplate);
router.patch('/admin/cv-templates/:id', validate(adminSchemas.cvTemplateUpdateSchema), controllers.updateCvTemplate);
router.get('/admin/cv-templates', controllers.getCvTemplatesAdmin);
router.get('/admin/cv-templates/:id', controllers.getCvTemplateById);
router.delete('/admin/cv-templates/:id', validate(adminSchemas.idOnlySchema), controllers.deleteCvTemplate);

router.post('/templates', validate(adminSchemas.cvTemplateCreateSchema), controllers.createCvTemplate);
router.put('/templates/:id', validate(adminSchemas.cvTemplateUpdateSchema), controllers.updateCvTemplate);
router.patch('/templates/:id', validate(adminSchemas.cvTemplateUpdateSchema), controllers.updateCvTemplate);
router.get('/templates', controllers.getCvTemplatesAdmin);
router.get('/templates/:id', controllers.getCvTemplateById);
router.delete('/templates/:id', validate(adminSchemas.idOnlySchema), controllers.deleteCvTemplate);

export default router;
