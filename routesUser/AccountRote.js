import express from "express";
import { authUser } from "../middlewares/userAuth.js";
import AccountPrivacyController from "../controllers/app/Me/AccountPrivacyController.js";

const router = express.Router();

// GDPR self-service account controls. All require an authenticated user and are
// strictly scoped to the caller's own record.
router.post(
  "/delete-request",
  authUser,
  express.json(),
  AccountPrivacyController.requestAccountDeletion
);
router.post(
  "/delete-request/cancel",
  authUser,
  AccountPrivacyController.cancelAccountDeletion
);
router.get("/export", authUser, AccountPrivacyController.exportMyData);

export default router;
