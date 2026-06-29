import express from "express";
import multer from "../utils/multer.js";
import Login from "../controllers/companyDash/Auth/loginController.js";
import ForgotPassword from "../controllers/app/Auth/ForgotPasswordController.js";
import PassCodeForgotPasswordController from "../controllers/app/Auth/PassCodeForgotPasswordController.js";
import ForGotPasswordResetPasswordController from "../controllers/app/Auth/ForGotPasswordResetPasswordController.js";
import { authUser } from "../middlewares/userAuth.js";
import {
  requireAppAccount,
  requireCompanyContext,
} from "../middlewares/appAccountGuard.js";
import validate from "../middlewares/validate.js";
import authSchemas from "../validations/authValidations.js";
import companySchemas from "../validations/company.validation.js";

const upload = multer;
const router = express.Router();
const companySessionGuard = [
  authUser,
  requireCompanyContext,
  requireAppAccount("company"),
];

const forceCompanyWebAuthScope = (req, _res, next) => {
  req.headers["x-web-auth-scope"] = "company";
  return next();
};

router.post(
  "/login",
  upload.none(),
  validate(companySchemas.loginSchema),
  Login.login,
);
router.post(
  "/refresh",
  upload.none(),
  validate(companySchemas.logoutSchema),
  Login.refresh,
);
router.post(
  "/refresh-token",
  upload.none(),
  validate(companySchemas.logoutSchema),
  Login.refresh,
);
router.post(
  "/logout",
  upload.none(),
  validate(companySchemas.logoutSchema),
  Login.logout,
);
router.post(
  "/logout-all",
  companySessionGuard,
  upload.none(),
  validate(authSchemas.emptyBodySchema),
  Login.logoutAll,
);
router.get("/sessions", companySessionGuard, Login.listSessions);
router.delete(
  "/sessions/:sessionId",
  companySessionGuard,
  validate(companySchemas.sessionIdSchema),
  Login.revokeSession,
);
router.post(
  "/forgot-password",
  forceCompanyWebAuthScope,
  upload.none(),
  validate(authSchemas.forgotPasswordSchema),
  ForgotPassword.forgotPassword,
);
router.post(
  "/passcode-forgot-password",
  forceCompanyWebAuthScope,
  upload.none(),
  validate(authSchemas.passcodeVerifySchema),
  PassCodeForgotPasswordController.passcodeVerify,
);
router.post(
  ["/resetPassword", "/reset-password"],
  forceCompanyWebAuthScope,
  upload.none(),
  validate(authSchemas.forgotResetPasswordSchema),
  ForGotPasswordResetPasswordController.resetPassword,
);

export default router;
