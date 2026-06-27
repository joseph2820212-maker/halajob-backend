import express from 'express';
import multer from '../utils/multer.js';
import controller from '../controllers/dash/adminResourceController.js';
import { checkPermission } from '../middlewares/checkPermission.js';

const upload = multer;

export const createDashResourceRouter = (resourceName) => {
  const router = express.Router();
  const canRead = checkPermission([`${resourceName}.read`, `${resourceName}.manage`, 'resources.read', 'resources.manage']);
  const canCreate = checkPermission([`${resourceName}.create`, `${resourceName}.manage`, 'resources.create', 'resources.manage']);
  const canUpdate = checkPermission([`${resourceName}.update`, `${resourceName}.manage`, 'resources.update', 'resources.manage']);
  const canDelete = checkPermission([`${resourceName}.delete`, `${resourceName}.manage`, 'resources.delete', 'resources.manage']);
  const canApprove = checkPermission([`${resourceName}.approve`, `${resourceName}.moderate`, `${resourceName}.manage`, 'resources.approve', 'resources.manage']);
  const canReject = checkPermission([`${resourceName}.reject`, `${resourceName}.moderate`, `${resourceName}.manage`, 'resources.reject', 'resources.manage']);

  router.get('/get', canRead, controller.list(resourceName));
  router.get('/list', canRead, controller.list(resourceName));
  router.get('/', canRead, controller.list(resourceName));

  router.get('/getOne', canRead, controller.getOne(resourceName));
  router.get('/getOne/:id', canRead, controller.getOne(resourceName));
  router.get('/get-one/:id', canRead, controller.getOne(resourceName));
  router.get('/details/:id', canRead, controller.getOne(resourceName));
  router.get('/:id', canRead, controller.getOne(resourceName));

  router.post('/create', canCreate, upload.any(), controller.create(resourceName));
  router.post('/', canCreate, upload.any(), controller.create(resourceName));

  router.post('/update/:id', canUpdate, upload.any(), controller.update(resourceName));
  router.put('/update/:id', canUpdate, upload.any(), controller.update(resourceName));
  router.patch('/update/:id', canUpdate, upload.any(), controller.update(resourceName));
  router.put('/:id', canUpdate, upload.any(), controller.update(resourceName));
  router.patch('/:id', canUpdate, upload.any(), controller.update(resourceName));

  router.post('/bulk-update', canUpdate, upload.none(), controller.bulkUpdate(resourceName));
  router.patch('/bulk-update', canUpdate, upload.none(), controller.bulkUpdate(resourceName));

  router.post('/approve/:id', canApprove, upload.none(), controller.approve(resourceName));
  router.patch('/approve/:id', canApprove, upload.none(), controller.approve(resourceName));
  router.post('/reject/:id', canReject, upload.none(), controller.reject(resourceName));
  router.patch('/reject/:id', canReject, upload.none(), controller.reject(resourceName));

  router.post('/delete/:id', canDelete, upload.none(), controller.remove(resourceName));
  router.delete('/delete/:id', canDelete, controller.remove(resourceName));
  router.delete('/:id', canDelete, controller.remove(resourceName));

  return router;
};

export default createDashResourceRouter;
