import express from "express";
import { authUser } from "../middlewares/userAuth.js";
import NotificationController from "../controllers/app/Notification/NotificationController.js";
import NotificationV1Controller from "../controllers/app/Notification/NotificationV1Controller.js";

const router = express.Router();

router.get("/", authUser, NotificationController.list);
router.get("/get", authUser, NotificationController.list);
router.get("/unread-count", authUser, NotificationController.unreadCount);
router.get("/preferences", authUser, NotificationV1Controller.getPreferences);
router.put("/preferences", authUser, express.json(), NotificationV1Controller.updatePreferences);
router.patch("/preferences", authUser, express.json(), NotificationV1Controller.updatePreferences);

router.post("/read-all", authUser, NotificationController.markAllRead);
router.patch("/read-all", authUser, NotificationController.markAllRead);

router.post("/:id/read", authUser, NotificationController.markRead);
router.patch("/:id/read", authUser, NotificationController.markRead);

router.post("/:id/unread", authUser, NotificationController.markUnread);
router.patch("/:id/unread", authUser, NotificationController.markUnread);

router.delete("/:id", authUser, NotificationController.remove);
router.post("/:id/delete", authUser, NotificationController.remove);

export default router;
