import APIError from '../utils/apiError.js';
import { RefreshTokenModel, UserModel } from '../models/index.js';
import httpStatus from 'http-status';
import { tokenTypes } from '../config/tokens.js';
import { verify } from '../utils/jwtHelpers.js';

const getBearerToken = (req) => {
  const authHeader = req.get('Authorization') || '';
  if (!authHeader.startsWith('Bearer ')) return null;
  return authHeader.slice(7).trim();
};

const withoutPassword = (user) => {
  if (!user) return user;
  const plain = typeof user.toObject === 'function' ? user.toObject() : { ...user };
  delete plain.password;
  delete plain.passcode;
  delete plain.another_device_code;
  return plain;
};

const isAdmin = async (req, res, next) => {
  try {
    const accessToken = getBearerToken(req);

    if (!accessToken) {
      throw new APIError(httpStatus.UNAUTHORIZED, 'Authorization header missing or malformed');
    }

    const tokenPayload = await verify(accessToken, process.env.JWT_SECRET);

    if (!tokenPayload || tokenPayload.type !== tokenTypes.ACCESS) {
      throw new APIError(httpStatus.UNAUTHORIZED, 'Invalid or expired access token');
    }

    const user = await UserModel.findById(tokenPayload.userId)
      .populate({ path: 'role_id', populate: { path: 'permissions' } })
      .populate('permissions')
      .lean();

    if (!user) {
      throw new APIError(httpStatus.FORBIDDEN, 'User not found. Please log in again.');
    }

    if (!user.status) {
      throw new APIError(httpStatus.FORBIDDEN, 'This dashboard account is inactive.');
    }

    const role = user.role_id || null;
    const isDashAccount = role?.log_to === 'dash';

    if (!isDashAccount) {
      throw new APIError(httpStatus.FORBIDDEN, 'This account is not allowed to access dashboard APIs.');
    }

    const loginTime = tokenPayload.loginTime ? new Date(tokenPayload.loginTime) : null;
    const refreshTokenExists = await RefreshTokenModel.exists({
      userRef: tokenPayload.userId,
      ...(loginTime && !Number.isNaN(loginTime.valueOf()) ? { loginTime } : {}),
    });

    if (!refreshTokenExists) {
      throw new APIError(httpStatus.FORBIDDEN, 'Session expired. Please log in again.');
    }

    const safeUser = withoutPassword(user);

    req.user = safeUser;
    req.admin = safeUser;
    req.authData = safeUser;
    req.auth = {
      userId: tokenPayload.userId,
      loginTime: tokenPayload.loginTime,
      token: accessToken,
      role,
    };

    next();
  } catch (error) {
    next(error);
  }
};

export { isAdmin };
export default isAdmin;
