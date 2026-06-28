import express from "express";
import { authUser } from "../middlewares/userAuth.js";
import validate from "../middlewares/validate.js";
import AccountContextController from "../controllers/app/Me/AccountContextController.js";
import accountSchemas from "../validations/account.validation.js";

const router = express.Router();

router.get("/contexts", authUser, AccountContextController.listContexts);
router.post(
  "/active-context",
  authUser,
  express.json(),
  validate(accountSchemas.activeContextSchema),
  AccountContextController.setActiveContext
);
router.get("/permissions", authUser, AccountContextController.permissions);

export default router;
