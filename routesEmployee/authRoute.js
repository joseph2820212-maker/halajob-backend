import express from "express";
import multer from "../utils/multer.js";
import validate from "../middlewares/validate.js";
import seekerSchemas from "../validations/seeker.validation.js";
import Login from "../controllers/employeeDash/Auth/loginController.js";

const upload = multer;
const router = express.Router();

router.post("/login", upload.none(), validate(seekerSchemas.loginSchema), Login.login);

export default router;
