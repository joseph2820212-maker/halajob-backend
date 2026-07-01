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

  // Wave 3 (cleanup): collapsed to REST-standard verbs. Every dropped verb below was
  // hitting the SAME controller as its kept sibling — verified by the endpoint audit.
  // Legacy aliases removed: GET /get, GET /list, GET /getOne, GET /getOne/:id,
  // GET /get-one/:id, GET /details/:id, POST /create, POST /update/:id,
  // PUT /update/:id, PATCH /update/:id, PUT /:id, PATCH /bulk-update,
  // POST /approve/:id (kept PATCH), POST /reject/:id (kept PATCH), POST /delete/:id.
  router.get('/', canRead, validate(adminSchemas.listResourceSchema), controller.list(resourceName));
  router.get('/:id', canRead, validate(adminSchemas.idResourceSchema), controller.getOne(resourceName));

  router.post('/', canCreate, upload.any(), validate(adminSchemas.createResourceSchema), controller.create(resourceName));

  router.patch('/:id', canUpdate, upload.any(), validate(adminSchemas.updateResourceSchema), controller.update(resourceName));

  router.post('/bulk-update', canUpdate, upload.none(), validate(adminSchemas.bulkUpdateResourceSchema), controller.bulkUpdate(resourceName));

  router.patch('/approve/:id', canApprove, upload.none(), validate(adminSchemas.statusResourceSchema), controller.approve(resourceName));
  router.patch('/reject/:id', canReject, upload.none(), validate(adminSchemas.statusResourceSchema), controller.reject(resourceName));

  router.delete('/:id', canDelete, validate(adminSchemas.deleteResourceSchema), controller.remove(resourceName));

  return router;
};

export default createDashResourceRouter;
