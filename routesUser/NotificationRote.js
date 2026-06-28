import express from "express";
import { authUser } from "../middlewares/userAuth.js";
import validate from "../middlewares/validate.js";
import seekerSchemas from "../validations/seeker.validation.js";
import NotificationController from "../controllers/app/Notification/NotificationController.js";
import NotificationV1Controller from "../controllers/app/Notification/NotificationV1Controller.js";

const router = express.Router();

router.get("/", authUser, NotificationController.list);
router.get("/get", authUser, NotificationController.list);
router.get("/unread-count", authUser, NotificationController.unreadCount);
router.get("/preferences", authUser, validate(seekerSchemas.notificationPreferencesSchema), NotificationV1Controller.getPreferences);
router.put("/preferences", authUser, express.json(), validate(seekerSchemas.notificationPreferencesSchema), NotificationV1Controller.updatePreferences);
router.patch("/preferences", authUser, express.json(), validate(seekerSchemas.notificationPreferencesSchema), NotificationV1Controller.updatePreferences);

router.post("/read-all", authUser, validate(seekerSchemas.notificationActionSchema), NotificationController.markAllRead);
router.patch("/read-all", authUser, validate(seekerSchemas.notificationActionSchema), NotificationController.markAllRead);

router.post("/:id/read", authUser, validate(seekerSchemas.notificationIdSchema), NotificationController.markRead);
router.patch("/:id/read", authUser, validate(seekerSchemas.notificationIdSchema), NotificationController.markRead);

router.post("/:id/unread", authUser, validate(seekerSchemas.notificationIdSchema), NotificationController.markUnread);
router.patch("/:id/unread", authUser, validate(seekerSchemas.notificationIdSchema), NotificationController.markUnread);

router.delete("/:id", authUser, validate(seekerSchemas.notificationIdSchema), NotificationController.remove);
router.post("/:id/delete", authUser, validate(seekerSchemas.notificationIdSchema), NotificationController.remove);

export default router;
