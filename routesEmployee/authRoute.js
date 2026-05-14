import express from "express";
import multer from "../utils/multer.js";
import Login from "../controllers/employeeDash/Auth/loginController.js";

const upload = multer;
const router = express.Router();

router.post("/login", upload.none(), Login.login);

export default router;
