import express from "express";
import { authUser } from "../middlewares/userAuth.js";
import NotificationV1Controller from "../controllers/app/Notification/NotificationV1Controller.js";

const router = express.Router();

router.use(authUser);

router.get("/", NotificationV1Controller.list);
router.get("/list", NotificationV1Controller.list);
router.get("/unread-count", NotificationV1Controller.unreadCount);

router.post("/read", NotificationV1Controller.markRead);
router.patch("/read", NotificationV1Controller.markRead);
router.post("/read-all", NotificationV1Controller.markRead);
router.patch("/read-all", NotificationV1Controller.markRead);
router.post("/:id/read", NotificationV1Controller.markRead);
router.patch("/:id/read", NotificationV1Controller.markRead);

router.post("/device-token", express.json(), NotificationV1Controller.registerDeviceToken);
router.delete("/device-token", express.json(), NotificationV1Controller.deleteDeviceToken);
router.post("/device-token/delete", express.json(), NotificationV1Controller.deleteDeviceToken);
router.delete("/device-token/:id", NotificationV1Controller.deleteDeviceToken);

export default router;
