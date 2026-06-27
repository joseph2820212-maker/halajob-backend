import { UserModel, RefreshTokenModel } from '../models/index.js';
import httpStatus from 'http-status';
import { tokenTypes } from '../config/tokens.js';
import { verify } from '../utils/jwtHelpers.js';

const optionalAuthUser = async (req, res, next) => {
  try {
    // =========================
    // GET AUTH HEADER
    // =========================
    const authHeader = req.get('Authorization');

    // no token -> continue as guest
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    // =========================
    // GET ACCESS TOKEN
    // =========================
    const accessToken = authHeader.split(' ')[1];

    if (!accessToken) {
      req.user = null;
      return next();
    }

    // =========================
    // VERIFY TOKEN
    // =========================
    const tokenPayload = await verify(
      accessToken,
      process.env.JWT_SECRET
    );

    if (!tokenPayload) {
      req.user = null;
      return next();
    }

    // =========================
    // CHECK TOKEN TYPE
    // =========================
    if (tokenPayload.type !== tokenTypes.ACCESS) {
      req.user = null;
      return next();
    }

    // =========================
    // FIND USER
    // =========================
    const user = await UserModel.findById(tokenPayload.userId.toString())
      .select('-password -passcode -another_device_code -pending_device -device')
      .lean();

    if (!user) {
      req.user = null;
      return next();
    }

    if (!user.status) {
      req.user = null;
      return next();
    }

    // =========================
    // CHECK SESSION
    // =========================
    const refreshTokenExists = await RefreshTokenModel.exists({
      userRef: tokenPayload.userId,
      loginTime: tokenPayload.loginTime,
    });

    if (!refreshTokenExists) {
      req.user = null;
      return next();
    }

    // =========================
    // SUCCESS
    // =========================
    req.user = user;
    req.authHeader = accessToken;

    next();
  } catch (error) {
    // optional auth -> never throw
    req.user = null;

    next();
  }
};

export { optionalAuthUser };
