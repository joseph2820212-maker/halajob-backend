import express from "express";
import { authUser } from "../middlewares/userAuth.js";
import NotificationController from "../controllers/app/Notification/NotificationController.js";

const router = express.Router();

router.get("/", authUser, NotificationController.list);
router.get("/get", authUser, NotificationController.list);
router.get("/unread-count", authUser, NotificationController.unreadCount);

router.post("/read-all", authUser, NotificationController.markAllRead);
router.patch("/read-all", authUser, NotificationController.markAllRead);

router.post("/:id/read", authUser, NotificationController.markRead);
router.patch("/:id/read", authUser, NotificationController.markRead);

router.post("/:id/unread", authUser, NotificationController.markUnread);
router.patch("/:id/unread", authUser, NotificationController.markUnread);

router.delete("/:id", authUser, NotificationController.remove);
router.post("/:id/delete", authUser, NotificationController.remove);

export default router;
