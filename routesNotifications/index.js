import express from "express";
import { authUser } from "../middlewares/userAuth.js";
import NotificationV1Controller from "../controllers/app/Notification/NotificationV1Controller.js";
import validate from "../middlewares/validate.js";
import platformSchemas from "../validations/platform.validation.js";

const router = express.Router();

router.use(authUser);

router.get("/", NotificationV1Controller.list);
router.get("/list", NotificationV1Controller.list);
router.get("/unread-count", NotificationV1Controller.unreadCount);
router.get("/preferences", validate(platformSchemas.notificationPreferencesSchema), NotificationV1Controller.getPreferences);
router.put("/preferences", express.json(), validate(platformSchemas.notificationPreferencesSchema), NotificationV1Controller.updatePreferences);
router.patch("/preferences", express.json(), validate(platformSchemas.notificationPreferencesSchema), NotificationV1Controller.updatePreferences);

router.post("/read", validate(platformSchemas.notificationMarkReadSchema), NotificationV1Controller.markRead);
router.patch("/read", validate(platformSchemas.notificationMarkReadSchema), NotificationV1Controller.markRead);
router.post("/read-all", validate(platformSchemas.notificationMarkReadSchema), NotificationV1Controller.markRead);
router.patch("/read-all", validate(platformSchemas.notificationMarkReadSchema), NotificationV1Controller.markRead);
router.post("/:id/read", validate(platformSchemas.notificationMarkReadSchema), NotificationV1Controller.markRead);
router.patch("/:id/read", validate(platformSchemas.notificationMarkReadSchema), NotificationV1Controller.markRead);

router.post("/device-token", express.json(), validate(platformSchemas.deviceTokenRegisterSchema), NotificationV1Controller.registerDeviceToken);
router.delete("/device-token", express.json(), validate(platformSchemas.deviceTokenDeleteSchema), NotificationV1Controller.deleteDeviceToken);
router.post("/device-token/delete", express.json(), validate(platformSchemas.deviceTokenDeleteSchema), NotificationV1Controller.deleteDeviceToken);
router.delete("/device-token/:id", validate(platformSchemas.deviceTokenDeleteSchema), NotificationV1Controller.deleteDeviceToken);

export default router;
