import ReturnAppData from "../../../helper/ReturnAppData/index.js";
import {
  UserModel,
  UserApplyingJobModel,
  UserSavedJobModel,
  UserResumeModel,
} from "../../../models/index.js";
import { writeAuditLog } from "../../../services/auditLog.service.js";

// Fields that must never leave the server in a self-service data export.
const EXPORT_EXCLUDED_FIELDS = [
  "-password",
  "-passcode",
  "-passcode_expires_at",
  "-passcode_attempts",
  "-another_device_code",
  "-another_device_expires_at",
  "-pending_device",
  "-__v",
].join(" ");

// POST /user/v1/account/delete-request
// Reversible GDPR deletion request. Sets a status + timestamp and audit-logs it.
// Actual erasure is performed out-of-band by an admin/cron after the grace
// period — we never hard-delete here because no cascade exists for related data.
const requestAccountDeletion = async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.user._id);
    if (!user) {
      return ReturnAppData.getError({ res, status: 404, message: "user_not_found" });
    }

    if (user.account_deletion_status === "requested") {
      return ReturnAppData.getData({
        res,
        status: 200,
        message: "account_deletion_already_requested",
        data: {
          account_deletion_status: user.account_deletion_status,
          account_deletion_requested_at: user.account_deletion_requested_at,
        },
      });
    }

    const reason =
      typeof req.body?.reason === "string" ? req.body.reason.trim().slice(0, 500) : null;

    user.account_deletion_status = "requested";
    user.account_deletion_requested_at = new Date();
    user.account_deletion_reason = reason;
    await user.save();

    await writeAuditLog({
      req,
      actorUserId: user._id,
      actorType: "employee",
      action: "account_deletion_requested",
      entityType: "user",
      entityId: user._id,
      note: reason || "",
    });

    return ReturnAppData.updateData({
      res,
      status: 202,
      message: "account_deletion_requested",
      data: {
        account_deletion_status: user.account_deletion_status,
        account_deletion_requested_at: user.account_deletion_requested_at,
      },
    });
  } catch (error) {
    return next(error);
  }
};

// POST /user/v1/account/delete-request/cancel
// Lets a user reverse a pending deletion request before it is processed.
const cancelAccountDeletion = async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.user._id);
    if (!user) {
      return ReturnAppData.getError({ res, status: 404, message: "user_not_found" });
    }

    if (user.account_deletion_status !== "requested") {
      return ReturnAppData.getError({
        res,
        status: 400,
        message: "no_pending_account_deletion",
      });
    }

    user.account_deletion_status = "cancelled";
    user.account_deletion_requested_at = null;
    user.account_deletion_reason = null;
    await user.save();

    await writeAuditLog({
      req,
      actorUserId: user._id,
      actorType: "employee",
      action: "account_deletion_cancelled",
      entityType: "user",
      entityId: user._id,
    });

    return ReturnAppData.updateData({
      res,
      status: 202,
      message: "account_deletion_cancelled",
      data: { account_deletion_status: user.account_deletion_status },
    });
  } catch (error) {
    return next(error);
  }
};

// GET /user/v1/account/export
// Self-service GDPR data export. Read-only, strictly scoped to the caller's own
// records. Secrets/credentials are excluded; this never reaches other users' data.
const exportMyData = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [profile, applications, savedJobs, resumes] = await Promise.all([
      UserModel.findById(userId).select(EXPORT_EXCLUDED_FIELDS).lean(),
      UserApplyingJobModel.find({ user_id: userId }).select("-__v").lean(),
      UserSavedJobModel.find({ user_id: userId }).select("-__v").lean(),
      UserResumeModel.find({ user_id: userId }).select("-__v").lean(),
    ]);

    if (!profile) {
      return ReturnAppData.getError({ res, status: 404, message: "user_not_found" });
    }

    await writeAuditLog({
      req,
      actorUserId: userId,
      actorType: "employee",
      action: "account_data_exported",
      entityType: "user",
      entityId: userId,
    });

    return ReturnAppData.getData({
      res,
      message: "account_data_export",
      data: {
        exported_at: new Date(),
        profile,
        applications,
        saved_jobs: savedJobs,
        resumes,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export default {
  requestAccountDeletion,
  cancelAccountDeletion,
  exportMyData,
};
