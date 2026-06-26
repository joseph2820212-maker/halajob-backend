import express from "express";
import multer from "../utils/multer.js";
import Login from "../controllers/companyDash/Auth/loginController.js";

const upload = multer;
const router = express.Router();

router.post("/login", upload.none(), Login.login);
router.post("/logout", upload.none(), Login.logout);

export default router;
