import express from "express";
import { authUser } from "../middlewares/userAuth.js";
import validate from "../middlewares/validate.js";
import AccountPrivacyController from "../controllers/app/Me/AccountPrivacyController.js";
import accountSchemas from "../validations/account.validation.js";

const router = express.Router();

// GDPR self-service account controls. All require an authenticated user and are
// strictly scoped to the caller's own record.
router.post(
  "/delete-request",
  authUser,
  express.json(),
  validate(accountSchemas.accountDeletionRequestSchema),
  AccountPrivacyController.requestAccountDeletion
);
router.post(
  "/delete-request/cancel",
  authUser,
  validate(accountSchemas.emptyBodySchema),
  AccountPrivacyController.cancelAccountDeletion
);
router.get("/export", authUser, AccountPrivacyController.exportMyData);

export default router;
