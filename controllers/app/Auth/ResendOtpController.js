// controller/auth/ResendOtpController.js
import crypto from "crypto";
import ReturnAppData from "../../../helper/ReturnAppData/index.js";
import { UserModel } from "../../../models/index.js";
import { sendRecoveryEmail } from "../../../helper/sendEmail.js";

const normEmail = (e) => (e || "").trim().toLowerCase();
const safeStr = (v) => (typeof v === "string" ? v.trim() : "");

const OTP_EXPIRE_MINUTES = 10;
const RESEND_COOLDOWN_SECONDS = 60;

function createPasscode() {
  return crypto.randomInt(10000, 100000);
}

function getRemainingSeconds(lastSentAt) {
  if (!lastSentAt) return 0;

  const diffMs = Date.now() - new Date(lastSentAt).getTime();
  const diffSeconds = Math.floor(diffMs / 1000);

  return Math.max(RESEND_COOLDOWN_SECONDS - diffSeconds, 0);
}

const resendOtp = async (req, res, next) => {
  const lan = req.get("lan") || "en";

  try {
    const { email, type = "auto" } = req.body || {};
    const identifier = safeStr(email);

    if (!identifier) {
      return ReturnAppData.createError({
        res,
        status: 400,
        message: lan === "ar" ? "البريد أو رقم الهاتف مطلوب." : "Email or phone is required.",
      });
    }

    const user = identifier.includes("@")
      ? await UserModel.findOne({ email: normEmail(identifier) })
      : await UserModel.findOne({ phone_national: identifier });

    if (!user) {
      return ReturnAppData.createError({
        res,
        status: 400,
        message: lan === "ar" ? "البيانات المرسلة غير صحيحة." : "The data sent is incorrect.",
      });
    }

    if (!user.email) {
      return ReturnAppData.createError({
        res,
        status: 400,
        message: lan === "ar" ? "لا يوجد بريد إلكتروني لهذا الحساب." : "This account has no email.",
      });
    }
let otpType = String(type || "auto").trim();

if (otpType === "auto") {
  if (user.pending_device) {
    otpType = "new_device";
  } else if (!user.status || user.passcode_active === false) {
    otpType = "verify_account";
  } else {
    return ReturnAppData.createError({
      res,
      status: 400,
      message:
        lan === "ar"
          ? "لا توجد عملية تحقق حالية لإعادة إرسال الرمز."
          : "There is no active verification process to resend OTP.",
    });
  }
}

if (
  otpType === "verify_account" &&
  user.status === true &&
  user.passcode_active === true &&
  user.pending_device
) {
  otpType = "new_device";
}

    const remainingSeconds = getRemainingSeconds(user.otp_last_sent_at);

    if (remainingSeconds > 0) {
      return ReturnAppData.createError({
        res,
        status: 429,
        data: {
          retry_after_seconds: remainingSeconds,
        },
        message:
          lan === "ar"
            ? `يرجى الانتظار ${remainingSeconds} ثانية قبل إعادة إرسال الرمز.`
            : `Please wait ${remainingSeconds} seconds before resending the code.`,
      });
    }

    const passcode = createPasscode();
    const expiresAt = new Date(Date.now() + OTP_EXPIRE_MINUTES * 60 * 1000);
    const now = new Date();
    if (otpType === "verify_account") {
      if (user.status && user.passcode_active) {
        return ReturnAppData.createError({
          res,
          status: 400,
          message: lan === "ar" ? "الحساب مفعل مسبقاً." : "Account is already verified.",
        });
      }

      user.passcode = passcode;
      user.passcode_expires_at = expiresAt;
    } else if (otpType === "forgot_password") {
      user.passcode = passcode;
      user.passcode_expires_at = expiresAt;
      user.can_update_password = false;
    } else if (otpType === "new_device") {
      if (!user.pending_device) {
        return ReturnAppData.createError({
          res,
          status: 409,
          message: lan === "ar" ? "لا يوجد جهاز قيد التحقق." : "No device pending verification.",
        });
      }

      user.another_device_code = passcode;
      user.another_device_expires_at = expiresAt;
    } else {
      return ReturnAppData.createError({
        res,
        status: 400,
        message: lan === "ar" ? "نوع العملية غير صحيح." : "Invalid OTP type.",
      });
    }

    user.otp_last_sent_at = now;
    user.passcode_attempts = 0;

    await user.save();
    await sendRecoveryEmail({ to: user.email, passcode });

    return ReturnAppData.createData({
      res,
      status: 200,
      data: {
        step: otpType === "new_device" ? "VERIFY_NEW_DEVICE" : "ENTER_PASSCODE",
        type: otpType,
        expires_in_seconds: OTP_EXPIRE_MINUTES * 60,
        resend_after_seconds: RESEND_COOLDOWN_SECONDS,
      },
      message: lan === "ar" ? "تم إرسال الرمز مرة أخرى." : "OTP has been resent.",
    });
  } catch (err) {
    console.error("resendOtp error:", err);
    return ReturnAppData.createError({
      res,
      status: 500,
      message: lan === "ar" ? "حدث خطأ غير متوقع." : "An unexpected error occurred.",
    });
  }
};

export default { resendOtp };
