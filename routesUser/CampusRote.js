import express from "express";
import { authUser } from "../middlewares/userAuth.js";
import campusController from "../controllers/app/campus/campusController.js";
import multer from "../utils/multer.js";

const router = express.Router();
const upload = multer;

router.get("/opportunities", campusController.opportunities);
router.get("/resources", campusController.resources);
router.get("/overview", authUser, campusController.overview);
router.get("/profile", authUser, campusController.profile);
router.put("/profile", authUser, upload.none(), campusController.updateProfile);
router.patch("/profile", authUser, upload.none(), campusController.updateProfile);

export default router;
