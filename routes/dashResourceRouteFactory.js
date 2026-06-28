import express from 'express';
import multer from '../utils/multer.js';
import controller from '../controllers/dash/adminResourceController.js';
import { checkPermission } from '../middlewares/checkPermission.js';
import validate from '../middlewares/validate.js';
import adminSchemas from '../validations/admin.validation.js';

const upload = multer;

export const createDashResourceRouter = (resourceName) => {
  const router = express.Router();
  const canRead = checkPermission([`${resourceName}.read`, `${resourceName}.manage`, 'resources.read', 'resources.manage']);
  const canCreate = checkPermission([`${resourceName}.create`, `${resourceName}.manage`, 'resources.create', 'resources.manage']);
  const canUpdate = checkPermission([`${resourceName}.update`, `${resourceName}.manage`, 'resources.update', 'resources.manage']);
  const canDelete = checkPermission([`${resourceName}.delete`, `${resourceName}.manage`, 'resources.delete', 'resources.manage']);
  const canApprove = checkPermission([`${resourceName}.approve`, `${resourceName}.moderate`, `${resourceName}.manage`, 'resources.approve', 'resources.manage']);
  const canReject = checkPermission([`${resourceName}.reject`, `${resourceName}.moderate`, `${resourceName}.manage`, 'resources.reject', 'resources.manage']);

  router.get('/get', canRead, validate(adminSchemas.listResourceSchema), controller.list(resourceName));
  router.get('/list', canRead, validate(adminSchemas.listResourceSchema), controller.list(resourceName));
  router.get('/', canRead, validate(adminSchemas.listResourceSchema), controller.list(resourceName));

  router.get('/getOne', canRead, validate(adminSchemas.getResourceSchema), controller.getOne(resourceName));
  router.get('/getOne/:id', canRead, validate(adminSchemas.idResourceSchema), controller.getOne(resourceName));
  router.get('/get-one/:id', canRead, validate(adminSchemas.idResourceSchema), controller.getOne(resourceName));
  router.get('/details/:id', canRead, validate(adminSchemas.idResourceSchema), controller.getOne(resourceName));
  router.get('/:id', canRead, validate(adminSchemas.idResourceSchema), controller.getOne(resourceName));

  router.post('/create', canCreate, upload.any(), validate(adminSchemas.createResourceSchema), controller.create(resourceName));
  router.post('/', canCreate, upload.any(), validate(adminSchemas.createResourceSchema), controller.create(resourceName));

  router.post('/update/:id', canUpdate, upload.any(), validate(adminSchemas.updateResourceSchema), controller.update(resourceName));
  router.put('/update/:id', canUpdate, upload.any(), validate(adminSchemas.updateResourceSchema), controller.update(resourceName));
  router.patch('/update/:id', canUpdate, upload.any(), validate(adminSchemas.updateResourceSchema), controller.update(resourceName));
  router.put('/:id', canUpdate, upload.any(), validate(adminSchemas.updateResourceSchema), controller.update(resourceName));
  router.patch('/:id', canUpdate, upload.any(), validate(adminSchemas.updateResourceSchema), controller.update(resourceName));

  router.post('/bulk-update', canUpdate, upload.none(), validate(adminSchemas.bulkUpdateResourceSchema), controller.bulkUpdate(resourceName));
  router.patch('/bulk-update', canUpdate, upload.none(), validate(adminSchemas.bulkUpdateResourceSchema), controller.bulkUpdate(resourceName));

  router.post('/approve/:id', canApprove, upload.none(), validate(adminSchemas.statusResourceSchema), controller.approve(resourceName));
  router.patch('/approve/:id', canApprove, upload.none(), validate(adminSchemas.statusResourceSchema), controller.approve(resourceName));
  router.post('/reject/:id', canReject, upload.none(), validate(adminSchemas.statusResourceSchema), controller.reject(resourceName));
  router.patch('/reject/:id', canReject, upload.none(), validate(adminSchemas.statusResourceSchema), controller.reject(resourceName));

  router.post('/delete/:id', canDelete, upload.none(), validate(adminSchemas.deleteResourceSchema), controller.remove(resourceName));
  router.delete('/delete/:id', canDelete, validate(adminSchemas.deleteResourceSchema), controller.remove(resourceName));
  router.delete('/:id', canDelete, validate(adminSchemas.deleteResourceSchema), controller.remove(resourceName));

  return router;
};

export default createDashResourceRouter;
