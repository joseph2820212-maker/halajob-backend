import bcryptjs from 'bcryptjs';
import ReturnAppData from '../../helper/ReturnAppData/index.js';
import { RoleModel, UserModel } from '../../models/index.js';
import {
  clearRefreshToken,
  generateAccessTokenFromRefreshTokenPayload,
  generateAuthTokens,
  rotateRefreshToken,
  verifyRefreshToken,
} from '../../services/tokenService.js';

const msg = (lan, ar, en) => (lan === 'ar' ? ar : en);
const normEmail = (email) => String(email || '').trim().toLowerCase();
const safeStr = (value) => String(value || '').trim();
const onlyDigits = (value) => String(value || '').replace(/\D+/g, '');

function stripSensitive(user) {
  if (!user) return user;
  const plain = typeof user.toObject === 'function' ? user.toObject() : { ...user };
  delete plain.password;
  delete plain.passcode;
  delete plain.another_device_code;
  delete plain.pending_device;
  return plain;
}

function ensureDeviceArray(user) {
  if (Array.isArray(user.device)) return;
  if (user.device && typeof user.device === 'object') user.device = [user.device];
  else user.device = [];
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

function buildIncomingDevice(req) {
  return {
    brand: safeStr(req.headers['sec-ch-ua']) || 'Unknown Browser',
    model_name: `${safeStr(req.headers['sec-ch-ua-platform']) || 'Unknown Platform'} Browser`,
    model_id: safeStr(req.headers['user-agent']) || null,
    is_device: false,
    build_id: safeStr(req.headers['sec-ch-ua-mobile']) || null,
    is_default: false,
    last_seen_at: new Date(),
  };
}

function buildPublicUrl(base, rel) {
  if (!rel) return null;
  if (/^https?:\/\//i.test(rel)) return rel;
  if (!base) return rel;
  const cleaned = String(rel).replace(/^\/+/, '');
  return base.endsWith('/') ? base + cleaned : `${base}/${cleaned}`;
}

async function buildAuthPayload(user, device) {
  const tokens = await generateAuthTokens(user, device);

  const role = user.role_id?._id
    ? user.role_id
    : user.role_id
      ? await RoleModel.findById(user.role_id).populate('permissions').lean()
      : null;

  return {
    user_id: user._id,
    first_name: user.first_name,
    mid_name: user.mid_name,
    last_name: user.last_name,
    full_name: [user.first_name, user.mid_name, user.last_name].filter(Boolean).join(' '),
    email: user.email,
    image: user.image ? buildPublicUrl(process.env.PUBLIC_BASE_URL, user.image) : null,
    phone_code: user.phone_code,
    phone: user.phone_national,
    phone_e164: user.phone_e164,
    gender: user.gender,
    role: role
      ? {
          id: role._id,
          name: role.name,
          log_to: role.log_to,
          title_ar: role.title_ar,
          title_en: role.title_en,
          permissions: [
            ...(role.permissions || []).map((p) => p.key || p).filter(Boolean),
            ...(user.permissions || []).map((p) => p.key || p).filter(Boolean),
          ],
        }
      : null,
    tokens,
  };
}

const login = async (req, res) => {
  const lan = req.get('lan') || 'en';

  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return ReturnAppData.createError({
        res,
        status: 400,
        message: msg(lan, 'البريد أو رقم الهاتف وكلمة المرور مطلوبة.', 'Email or phone and password are required.'),
      });
    }

    const identifier = safeStr(email);
    const user = identifier.includes('@')
      ? await UserModel.findOne({ email: normEmail(identifier) })
          .populate({ path: 'role_id', populate: { path: 'permissions' } })
          .populate('permissions')
      : await UserModel.findOne({
          $or: [
            { phone_national: identifier },
            { phone_e164: identifier },
            { phone_national: onlyDigits(identifier) },
          ],
        })
          .populate({ path: 'role_id', populate: { path: 'permissions' } })
          .populate('permissions');

    if (!user) {
      return ReturnAppData.createError({
        res,
        status: 400,
        message: msg(lan, 'البيانات المرسلة غير صحيحة.', 'The data sent is incorrect.'),
      });
    }

    const passwordOk = await bcryptjs.compare(String(password), user.password || '');
    if (!passwordOk) {
      return ReturnAppData.createError({
        res,
        status: 400,
        message: msg(lan, 'البيانات المرسلة غير صحيحة.', 'The data sent is incorrect.'),
      });
    }

    const role = user.role_id;
    if (role?.log_to !== 'dash') {
      return ReturnAppData.createError({
        res,
        status: 403,
        message: msg(lan, 'هذا الحساب لا يملك صلاحية الدخول إلى لوحة التحكم.', 'This account is not allowed to access dashboard.'),
      });
    }

    if (!user.status || role?.status === false) {
      return ReturnAppData.createError({
        res,
        status: 403,
        message: msg(lan, 'هذا الحساب غير فعال حالياً.', 'This account is currently inactive.'),
      });
    }

    const incomingDevice = buildIncomingDevice(req);

    ensureDeviceArray(user);
    const idx = user.device.findIndex((d) => isDeviceMatch(d, incomingDevice));

    let authDevice;
    if (idx >= 0) {
      user.device[idx].last_seen_at = new Date();
      if (incomingDevice.build_id) user.device[idx].build_id = incomingDevice.build_id;
      if (incomingDevice.model_id && !user.device[idx].model_id) user.device[idx].model_id = incomingDevice.model_id;
      makeDefaultDevice(user, idx);
      authDevice = user.device[idx];
    } else {
      user.device.push({ ...incomingDevice, is_default: true });
      makeDefaultDevice(user, user.device.length - 1);
      authDevice = user.device[user.device.length - 1];
    }

    user.markModified?.('device');
    await user.save();

    const authPayload = await buildAuthPayload(user, authDevice);

    return ReturnAppData.createData({
      res,
      status: 200,
      data: {
        ...authPayload,
        admin: stripSensitive(user),
      },
      message: msg(lan, 'تم تسجيل الدخول بنجاح.', 'Logged in successfully.'),
    });
  } catch (err) {
    console.error('admin login error:', err);
    return ReturnAppData.createError({
      res,
      status: 500,
      message: msg(lan, 'حدث خطأ غير متوقع.', 'An unexpected error occurred.'),
    });
  }
};

const me = async (req, res) => {
  return ReturnAppData.getData({
    res,
    data: req.admin || req.user,
  });
};

const refresh = async (req, res) => {
  const lan = req.get('lan') || 'en';
  try {
    const refreshToken = req.body?.refreshToken || req.body?.refresh_token || req.get('x-refresh-token');

    if (!refreshToken) {
      return ReturnAppData.createError({
        res,
        status: 400,
        message: msg(lan, 'رمز التحديث مطلوب.', 'Refresh token is required.'),
      });
    }

    const { tokenPayload, tokens } = req.body?.rotate === false || req.body?.rotate === 'false'
      ? {
          tokenPayload: await verifyRefreshToken(refreshToken),
          tokens: {
            accessToken: await generateAccessTokenFromRefreshTokenPayload(await verifyRefreshToken(refreshToken)),
            refreshToken,
          },
        }
      : await rotateRefreshToken(refreshToken);

    const user = await UserModel.findById(tokenPayload.userId)
      .populate({ path: 'role_id', populate: { path: 'permissions' } })
      .populate('permissions')
      .lean();

    if (!user || user.role_id?.log_to !== 'dash' || !user.status) {
      await clearRefreshToken(refreshToken);
      return ReturnAppData.createError({
        res,
        status: 403,
        message: msg(lan, 'جلسة غير صالحة.', 'Invalid session.'),
      });
    }

    return ReturnAppData.createData({
      res,
      status: 200,
      message: msg(lan, 'تم تحديث الجلسة.', 'Session refreshed.'),
      data: {
        tokens,
        admin: stripSensitive(user),
      },
    });
  } catch (err) {
    return ReturnAppData.createError({
      res,
      status: 403,
      message: msg(lan, 'انتهت الجلسة، يرجى تسجيل الدخول مجدداً.', 'Session expired. Please login again.'),
    });
  }
};

const logout = async (req, res) => {
  const lan = req.get('lan') || 'en';
  const refreshToken = req.body?.refreshToken || req.body?.refresh_token || req.get('x-refresh-token');
  if (!refreshToken) {
    return ReturnAppData.createError({
      res,
      status: 400,
      message: msg(lan, 'Ø±Ù…Ø² Ø§Ù„ØªØ­Ø¯ÙŠØ« Ù…Ø·Ù„ÙˆØ¨.', 'Refresh token is required.'),
    });
  }
  await clearRefreshToken(refreshToken);
  return ReturnAppData.deleteData({
    res,
    status: 200,
    message: 'logged_out',
  });
};

const createDashboardUser = async (req, res) => {
  const lan = req.get('lan') || 'en';
  try {
    const {
      first_name,
      mid_name = null,
      last_name,
      email,
      password,
      gender = 'male',
      role_id,
      role_name,
      phone_code = '+963',
      phone_country = 'SY',
      phone_national,
      permissions = [],
      status = true,
    } = req.body || {};

    if (!first_name || !last_name || !email || !password) {
      return ReturnAppData.createError({
        res,
        status: 400,
        message: msg(lan, 'الاسم والبريد وكلمة المرور مطلوبة.', 'Name, email and password are required.'),
      });
    }

    const role = role_id
      ? await RoleModel.findById(role_id)
      : await RoleModel.findOne({ name: role_name || 'our_employee', log_to: 'dash' });

    if (!role || role.log_to !== 'dash') {
      return ReturnAppData.createError({
        res,
        status: 400,
        message: msg(lan, 'دور لوحة التحكم غير صالح.', 'Invalid dashboard role.'),
      });
    }

    const cleanEmail = normEmail(email);
    const exists = await UserModel.exists({ email: cleanEmail });
    if (exists) {
      return ReturnAppData.createError({
        res,
        status: 400,
        message: msg(lan, 'البريد مستخدم مسبقاً.', 'Email already exists.'),
      });
    }

    const national = phone_national ? onlyDigits(phone_national) : `9${Date.now().toString().slice(-8)}`;
    const normalizedPhoneCode = String(phone_code).startsWith('+') ? String(phone_code) : `+${phone_code}`;

    const user = await UserModel.create({
      first_name,
      mid_name,
      last_name,
      email: cleanEmail,
      password: await bcryptjs.hash(String(password), 10),
      gender,
      role_id: role._id,
      permissions,
      status: status === true || status === 'true' || status === 1 || status === '1',
      lan,
      phone: `${normalizedPhoneCode}${national}`,
      phone_e164: `${normalizedPhoneCode}${national}`,
      phone_country,
      phone_code: normalizedPhoneCode,
      phone_national: national,
      device: [],
    });

    return ReturnAppData.createData({
      res,
      data: stripSensitive(user),
      message: msg(lan, 'تم إنشاء مستخدم لوحة التحكم.', 'Dashboard user created.'),
    });
  } catch (err) {
    return ReturnAppData.createError({
      res,
      status: 400,
      message: err.message || 'create_dashboard_user_failed',
      other: { code: err.code },
    });
  }
};

export default {
  login,
  me,
  refresh,
  logout,
  createDashboardUser,
};
