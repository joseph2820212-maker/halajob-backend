import express from 'express';
import multer from '../utils/multer.js';
import controller from '../controllers/dash/adminResourceController.js';

const upload = multer;

export const createDashResourceRouter = (resourceName) => {
  const router = express.Router();

  router.get('/get', controller.list(resourceName));
  router.get('/list', controller.list(resourceName));
  router.get('/', controller.list(resourceName));

  router.get('/getOne', controller.getOne(resourceName));
  router.get('/getOne/:id', controller.getOne(resourceName));
  router.get('/get-one/:id', controller.getOne(resourceName));
  router.get('/details/:id', controller.getOne(resourceName));
  router.get('/:id', controller.getOne(resourceName));

  router.post('/create', upload.any(), controller.create(resourceName));
  router.post('/', upload.any(), controller.create(resourceName));

  router.post('/update/:id', upload.any(), controller.update(resourceName));
  router.put('/update/:id', upload.any(), controller.update(resourceName));
  router.patch('/update/:id', upload.any(), controller.update(resourceName));
  router.put('/:id', upload.any(), controller.update(resourceName));
  router.patch('/:id', upload.any(), controller.update(resourceName));

  router.post('/bulk-update', upload.none(), controller.bulkUpdate(resourceName));
  router.patch('/bulk-update', upload.none(), controller.bulkUpdate(resourceName));

  router.post('/approve/:id', upload.none(), controller.approve(resourceName));
  router.patch('/approve/:id', upload.none(), controller.approve(resourceName));
  router.post('/reject/:id', upload.none(), controller.reject(resourceName));
  router.patch('/reject/:id', upload.none(), controller.reject(resourceName));

  router.post('/delete/:id', upload.none(), controller.remove(resourceName));
  router.delete('/delete/:id', controller.remove(resourceName));
  router.delete('/:id', controller.remove(resourceName));

  return router;
};

export default createDashResourceRouter;
