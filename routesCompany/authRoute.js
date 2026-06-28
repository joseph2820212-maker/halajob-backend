import express from "express";
import multer from "../utils/multer.js";
import Login from "../controllers/companyDash/Auth/loginController.js";
import validate from "../middlewares/validate.js";
import companySchemas from "../validations/company.validation.js";

const upload = multer;
const router = express.Router();

router.post("/login", upload.none(), validate(companySchemas.loginSchema), Login.login);
router.post("/logout", upload.none(), validate(companySchemas.logoutSchema), Login.logout);

export default router;
