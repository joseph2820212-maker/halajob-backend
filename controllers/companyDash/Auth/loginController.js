import bcryptjs from "bcrypt";
import ReturnAppData from "../../../helper/ReturnAppData/index.js";
import {
  CompanyMemberModel,
  CompanyModel,
  RefreshTokenModel,
  RoleModel,
  UserModel,
} from "../../../models/index.js";
import {
  clearRefreshToken,
  generateAuthTokens,
  rotateRefreshToken,
} from "../../../services/tokenService.js";
import { recordAnalyticsEvent } from "../../../services/analytics/analyticsEvent.service.js";
import {
  clearAllRefreshCookies,
  clearRefreshCookie,
  refreshTokenFromRequest,
  setRefreshCookie,
} from "../../../services/authCookie.service.js";
import { burnBcryptCycles } from "../../../services/authTiming.service.js";

const msg = (lan, ar, en) => (lan === "ar" ? ar : en);
const normEmail = (email) =>
  String(email || "")
    .trim()
    .toLowerCase();
const safeStr = (value) => String(value || "").trim();

function ensureDeviceArray(user) {
  if (Array.isArray(user.device)) return;

  if (user.device && typeof user.device === "object") {
    user.device = [user.device];
    return;
  }

  user.device = [];
}

function makeDefaultDevice(user, idx) {
  user.device = user.device.map((d, i) => ({
    ...d,
    is_default: i === idx,
  }));
}

function isDeviceMatch(oldDevice, incomingDevice) {
  return (
    safeStr(oldDevice?.brand) === safeStr(incomingDevice?.brand) &&
    safeStr(oldDevice?.model_name) === safeStr(incomingDevice?.model_name) &&
    safeStr(oldDevice?.model_id) === safeStr(incomingDevice?.model_id)
  );
}

function buildPublicUrl(base, rel) {
  if (!base) return rel;

  const cleaned = rel?.replace(/^\/+/, "") || "";
  return base.endsWith("/") ? base + cleaned : `${base}/${cleaned}`;
}

function normalizeRoleText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");
}

function roleAllowsCompanyLogin(role) {
  if (!role) return false;

  const values = [
    role.log_to,
    role.login_to,
    role.loginAs,
    role.portal,
    role.type,
    role.key,
    role.name,
    role.slug,
    role.code,
    role.title_en,
    role.title_ar,
  ];

  const normalizedValues = values.map(normalizeRoleText).filter(Boolean);

  const directMatch = normalizedValues.some((value) => {
    return (
      value === "company" ||
      value === "employer" ||
      value === "company_owner" ||
      value === "owner_company" ||
      value === "company_admin" ||
      value === "recruiter" ||
      value.includes("company") ||
      value.includes("employer") ||
      value.includes("recruiter") ||
      value.includes("شركة")
    );
  });

  if (directMatch) return true;

  const rolePermissions = Array.isArray(role.permissions)
    ? role.permissions
    : [];

  return rolePermissions.some((permission) => {
    const value = normalizeRoleText(
      permission?.key ||
        permission?.name ||
        permission?.code ||
        permission?.title_en ||
        permission?.title_ar ||
        permission,
    );

    return (
      value.includes("company") ||
      value.includes("employer") ||
      value.includes("recruiter") ||
      value.includes("شركة")
    );
  });
}

async function buildAuthPayload(user, device) {
  const tokens = await generateAuthTokens(user, device);

  const role = user.role_id?._id
    ? user.role_id
    : user.role_id
      ? await RoleModel.findById(user.role_id).lean()
      : null;

  return {
    user_id: user._id,
    first_name: user.first_name,
    mid_name: user.mid_name,
    last_name: user.last_name,
    image: user.image
      ? buildPublicUrl(process.env.PUBLIC_BASE_URL, user.image)
      : null,
    phone_code: user.phone_code,
    phone: user.phone_national,
    gender: user.gender,
    role: role
      ? {
          id: role._id,
          title_ar: role.title_ar,
          title_en: role.title_en,
          permissions: user.permissions || [],
        }
      : null,
    tokens,
  };
}

const login = async (req, res, next) => {
  const lan = req.get("lan") || "en";

  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return ReturnAppData.createError({
        res,
        status: 400,
        message: msg(
          lan,
          "البريد وكلمة المرور مطلوبة.",
          "Email and password are required.",
        ),
      });
    }

    const identifier = String(email).trim();

    const user = identifier.includes("@")
      ? await UserModel.findOne({ email: normEmail(identifier) }).populate(
          "role_id",
        )
      : await UserModel.findOne({ phone_national: identifier }).populate(
          "role_id",
        );

    if (!user) {
      // Match latency with the "wrong password" branch so the response
      // timing doesn't leak whether the account exists.
      await burnBcryptCycles(password);
      return ReturnAppData.createError({
        res,
        status: 400,
        message: msg(
          lan,
          "البيانات المرسلة غير صحيحة.",
          "The data sent is incorrect.",
        ),
      });
    }

    const ok = await bcryptjs.compare(String(password), user.password || "");

    if (!ok) {
      // Record the failed attempt for the audit trail. Matches what
      // /dash/v1 (admin) login does — the previous version was silent on
      // the wrong-password branch so grinding attempts against known
      // company emails left no record.
      recordAnalyticsEvent({
        req,
        event: "company_login_failed",
        userId: user._id,
        entityType: "other",
        metadata: { reason: "wrong_password", identifier_type: identifier.includes("@") ? "email" : "phone" },
      }).catch(() => null);

      return ReturnAppData.createError({
        res,
        status: 400,
        message: msg(
          lan,
          "البيانات المرسلة غير صحيحة.",
          "The data sent is incorrect.",
        ),
      });
    }

    /*
      Important:
      Do not reject company login using role only.
      Some old company users may have role names like:
      employer, company_owner, recruiter, or roles without log_to.
      The real company access proof is that this user owns a company profile.
    */
    const company = await CompanyModel.findOne({ owner_user_id: user._id })
      .populate("role_id")
      .populate(
        "owner_user_id",
        "-password -passcode -another_device_code -pending_device",
      );

    if (!company) {
      return ReturnAppData.createError({
        res,
        status: 404,
        message: msg(
          lan,
          "لم يتم العثور على بيانات الشركة المرتبطة بهذا الحساب.",
          "Company profile linked to this account was not found.",
        ),
      });
    }

    const isCompanyRole = roleAllowsCompanyLogin(user.role_id);

    /*
      If the company exists by owner_user_id, allow login.
      This prevents old/incorrect role records from breaking company login.
      You can log this for cleanup instead of blocking the user.
    */
    if (!isCompanyRole) {
      console.warn("Company login with non-company role:", {
        user_id: String(user._id),
        email: user.email,
        role_id: user.role_id?._id,
        role_name: user.role_id?.name,
        role_log_to: user.role_id?.log_to,
      });
    }

    /*
      Use strict false check.
      Some old users may have status undefined.
      !user.status would block them incorrectly.
    */
    if (user.status === false || company.status === false) {
      return ReturnAppData.createError({
        res,
        status: 403,
        message: msg(
          lan,
          "هذا الحساب غير فعال حالياً.",
          "This account is currently inactive.",
        ),
      });
    }

    if (company.accepted === false) {
      return ReturnAppData.createError({
        res,
        status: 403,
        message: msg(
          lan,
          "حساب الشركة بانتظار الموافقة.",
          "Company account is pending approval.",
        ),
      });
    }

    const incomingDevice = {
      brand: req.headers["sec-ch-ua"] || "Unknown Browser",
      model_name: `${req.headers["sec-ch-ua-platform"] || "Unknown Platform"} Browser`,
      model_id: req.headers["user-agent"] || null,
      is_device: false,
      build_id: req.headers["sec-ch-ua-mobile"] || null,
      is_default: false,
      last_seen_at: new Date(),
    };

    ensureDeviceArray(user);

    const idx = user.device.findIndex((d) => isDeviceMatch(d, incomingDevice));
    let authDevice;

    if (idx >= 0) {
      user.device[idx].last_seen_at = new Date();

      if (incomingDevice.build_id) {
        user.device[idx].build_id = incomingDevice.build_id;
      }

      if (incomingDevice.model_id && !user.device[idx].model_id) {
        user.device[idx].model_id = incomingDevice.model_id;
      }

      makeDefaultDevice(user, idx);
      authDevice = user.device[idx];
    } else {
      user.device.push({
        ...incomingDevice,
        is_default: true,
      });

      makeDefaultDevice(user, user.device.length - 1);
      authDevice = user.device[user.device.length - 1];
    }

    user.markModified?.("device");
    await user.save();

    const authPayload = await buildAuthPayload(user, authDevice);
    setRefreshCookie(req, res, authPayload.tokens?.refreshToken, "company");
    recordAnalyticsEvent({
      req,
      event: "login_completed",
      userId: user._id,
      companyId: company._id,
      entityType: "company",
      entityId: company._id,
      metadata: {
        source: "company_dashboard_login",
        portal: "company",
      },
    }).catch(() => null);

    return ReturnAppData.createData({
      res,
      status: 200,
      data: {
        ...authPayload,
        company,
      },
      message: msg(lan, "تم تسجيل الدخول بنجاح.", "Logged in successfully."),
    });
  } catch (err) {
    console.error("company login error:", err);

    return ReturnAppData.createError({
      res,
      status: 500,
      message: msg(lan, "حدث خطأ غير متوقع.", "An unexpected error occurred."),
    });
  }
};

const logout = async (req, res) => {
  const lan = req.get("lan") || "en";
  const refreshToken = refreshTokenFromRequest(req, "company");

  if (!refreshToken) {
    return ReturnAppData.createError({
      res,
      status: 400,
      message: msg(lan, "رمز التحديث مطلوب.", "Refresh token is required."),
    });
  }

  await clearRefreshToken(refreshToken);
  clearRefreshCookie(req, res, "company");

  return ReturnAppData.deleteData({
    res,
    status: 200,
    message: msg(lan, "تم تسجيل الخروج بنجاح.", "Successfully logged out."),
  });
};

const logoutAll = async (req, res, next) => {
  const lan = req.get("lan") || "en";

  try {
    const userId = req.user?._id;
    if (!userId) {
      return ReturnAppData.createError({
        res,
        status: 401,
        message: msg(lan, "Unauthorized.", "Unauthorized."),
      });
    }

    const result = await RefreshTokenModel.deleteMany({ userRef: userId });
    clearAllRefreshCookies(res);

    return ReturnAppData.createData({
      res,
      status: 200,
      message: msg(
        lan,
        "Signed out from all company sessions.",
        "Signed out from all company sessions.",
      ),
      data: { revoked_sessions: result?.deletedCount || 0 },
    });
  } catch (err) {
    return next(err);
  }
};

const refresh = async (req, res, next) => {
  const lan = req.get("lan") || "en";
  const refreshToken = refreshTokenFromRequest(req, "company");

  try {
    if (!refreshToken) {
      return ReturnAppData.createError({
        res,
        status: 400,
        message: msg(
          lan,
          "Ø±Ù…Ø² Ø§Ù„ØªØ­Ø¯ÙŠØ« Ù…Ø·Ù„ÙˆØ¨.",
          "Refresh token is required.",
        ),
      });
    }

    const { tokenPayload, tokens } = await rotateRefreshToken(refreshToken);
    const user = await UserModel.findById(tokenPayload.userId)
      .populate("role_id")
      .lean();
    const ownerCompany = user
      ? await CompanyModel.findOne({ owner_user_id: user._id })
          .populate("role_id")
          .lean()
      : null;
    const member = !ownerCompany && user
      ? await CompanyMemberModel.findOne({
          user_id: user._id,
          status: "active",
        })
          .populate("company_id")
          .populate("role_id")
          .lean()
      : null;
    const company = ownerCompany || member?.company_id || null;

    if (
      !user ||
      !company ||
      (member && member.status !== "active") ||
      user.status === false ||
      company.status === false ||
      company.accepted === false
    ) {
      await clearRefreshToken(tokens?.refreshToken || refreshToken);
      clearRefreshCookie(req, res, "company");
      return ReturnAppData.createError({
        res,
        status: 403,
        message: msg(lan, "Ø¬Ù„Ø³Ø© ØºÙŠØ± ØµØ§Ù„Ø­Ø©.", "Invalid session."),
      });
    }

    setRefreshCookie(req, res, tokens.refreshToken, "company");

    return ReturnAppData.createData({
      res,
      status: 200,
      data: {
        tokens,
        company,
        member: member
          ? {
              id: member._id,
              role_id: member.role_id?._id || member.role_id || null,
              member_role: member.member_role,
              permissions: member.permissions || [],
              status: member.status,
            }
          : null,
        user_id: user._id,
        first_name: user.first_name,
        mid_name: user.mid_name,
        last_name: user.last_name,
      },
      message: msg(lan, "ØªÙ… ØªØ­Ø¯ÙŠØ« Ø§Ù„Ø¬Ù„Ø³Ø©.", "Session refreshed."),
    });
  } catch (err) {
    return next(err);
  }
};

const listSessions = async (req, res, next) => {
  const lan = req.get("lan") || "en";

  try {
    const userId = req.user?._id;
    if (!userId) {
      return ReturnAppData.createError({
        res,
        status: 401,
        message: msg(lan, "Unauthorized.", "Unauthorized."),
      });
    }

    const currentRefreshToken = refreshTokenFromRequest(req, "company");
    // Look up the current session's _id from the token instead of shipping
    // every session's token to the client. Any client that can read the
    // /sessions payload could otherwise walk away with every one of the
    // user's live refresh tokens.
    const currentSession = currentRefreshToken
      ? await RefreshTokenModel.findOne({
          userRef: userId,
          token: currentRefreshToken,
        })
          .select("_id")
          .lean()
      : null;
    const currentSessionId = currentSession?._id?.toString() || null;

    const sessions = await RefreshTokenModel.find({ userRef: userId })
      .sort({ updatedAt: -1, loginTime: -1 })
      .select("_id loginTime expiresAt device createdAt updatedAt")
      .lean();

    return ReturnAppData.createData({
      res,
      status: 200,
      data: sessions.map((session) => ({
        id: session._id,
        loginTime: session.loginTime,
        expiresAt: session.expiresAt,
        device: session.device || null,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        current: Boolean(
          currentSessionId && session._id?.toString() === currentSessionId,
        ),
      })),
    });
  } catch (err) {
    return next(err);
  }
};

const revokeSession = async (req, res, next) => {
  const lan = req.get("lan") || "en";

  try {
    const userId = req.user?._id;
    const sessionId = req.params?.sessionId;
    if (!userId) {
      return ReturnAppData.createError({
        res,
        status: 401,
        message: msg(lan, "Unauthorized.", "Unauthorized."),
      });
    }

    const session = await RefreshTokenModel.findOneAndDelete({
      _id: sessionId,
      userRef: userId,
    }).lean();

    if (!session) {
      return ReturnAppData.createError({
        res,
        status: 404,
        message: msg(lan, "Session not found.", "Session not found."),
      });
    }

    const currentRefreshToken = refreshTokenFromRequest(req, "company");
    if (currentRefreshToken && session.token === currentRefreshToken) {
      clearRefreshCookie(req, res, "company");
    }

    return ReturnAppData.deleteData({
      res,
      status: 200,
      message: msg(lan, "Session revoked.", "Session revoked."),
    });
  } catch (err) {
    return next(err);
  }
};

export default {
  login,
  logout,
  logoutAll,
  refresh,
  listSessions,
  revokeSession,
};
