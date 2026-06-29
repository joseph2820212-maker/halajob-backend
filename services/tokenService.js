import crypto from 'crypto';
import moment from 'moment';
import httpStatus from 'http-status';

import { sign, verify } from '../utils/jwtHelpers.js';
import { tokenTypes } from '../config/tokens.js';
import { RefreshTokenModel } from '../models/index.js';
import APIError from '../utils/apiError.js';

const toBool = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    return ['true', '1', 'yes', 'y'].includes(value.trim().toLowerCase());
  }
  return false;
};

const cleanString = (value) => (typeof value === 'string' ? value.trim() : '');
const cleanLower = (value) => cleanString(value).toLowerCase();

const normalizeDevice = (device = {}) => ({
  brand: cleanString(device.brand),
  model_name: cleanString(device.model_name),
  model_id: cleanString(device.model_id) || null,
  is_device: toBool(device.is_device),
  build_id: cleanString(device.build_id) || null,
  is_default: Boolean(device.is_default),
  last_seen_at: new Date(),
});

const buildDeviceFingerprint = (device = {}) => {
  const normalized = normalizeDevice(device);
  return [
    cleanLower(normalized.brand),
    cleanLower(normalized.model_name),
    String(normalized.is_device),
  ].join('|');
};

const buildDeviceQuery = (userId, device = {}) => {
  const normalized = normalizeDevice(device);

  return {
    userRef: userId,
    'device.brand': normalized.brand,
    'device.model_name': normalized.model_name,
    'device.is_device': normalized.is_device,
  };
};

const generateToken = async (userId, loginTime, expires, type) => {
  const payload = {
    userId,
    loginTime: new Date(loginTime.valueOf()),
    exp: expires.unix(),
    type,
    jti: crypto.randomUUID(),
  };

  return sign(payload, process.env.JWT_SECRET);
};

const saveRefreshToken = async (userId, loginTime, token, device = {}, expiresAt) => {
  const normalizedDevice = normalizeDevice(device);
  const deviceFingerprint = buildDeviceFingerprint(normalizedDevice);
  const tokenExpiresAt = expiresAt ? new Date(expiresAt.valueOf ? expiresAt.valueOf() : expiresAt) : new Date(Date.now() + Number(process.env.REFRESH_TOKEN_EXPIRATION_DAYS || 30) * 24 * 60 * 60 * 1000);

  await RefreshTokenModel.findOneAndUpdate(
    buildDeviceQuery(userId, normalizedDevice),
    {
      $set: {
        userRef: userId,
        loginTime: new Date(loginTime.valueOf()),
        expiresAt: tokenExpiresAt,
        token,
        device: normalizedDevice,
        device_fingerprint: deviceFingerprint,
        updated_at: new Date(),
      },
      $setOnInsert: {
        created_at: new Date(),
      },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
  );
};

const clearRefreshToken = async (token) => {
  if (!token) return;
  await RefreshTokenModel.findOneAndDelete({ token });
};

const generateAuthTokens = async (user, device = {}) => {
  const loginTime = moment();
  const refreshTokenExpiresAt = loginTime
    .clone()
    .add(Number(process.env.REFRESH_TOKEN_EXPIRATION_DAYS || 30), 'days');

  const accessToken = await generateToken(
    user._id,
    loginTime,
    loginTime.clone().add(Number(process.env.ACCESS_TOKEN_EXPIRATION_MINUTES || 30), 'minutes'),
    tokenTypes.ACCESS
  );

  const refreshToken = await generateToken(
    user._id,
    loginTime,
    refreshTokenExpiresAt,
    tokenTypes.REFRESH
  );

  await saveRefreshToken(user._id, loginTime, refreshToken, device, refreshTokenExpiresAt);

  return {
    accessToken,
    refreshToken,
  };
};

const generateAccessTokenFromRefreshTokenPayload = async ({ userId, loginTime }) => {
  const now = moment();
  const accessTokenExpiresAt = now.clone().add(
    Number(process.env.ACCESS_TOKEN_EXPIRATION_MINUTES || 30),
    'minutes'
  );

  return generateToken(userId, moment(loginTime), accessTokenExpiresAt, tokenTypes.ACCESS);
};

const verifyRefreshToken = async (token) => {
  const tokenPayload = await verify(token, process.env.JWT_SECRET);

  if (!tokenPayload || tokenPayload.type !== tokenTypes.REFRESH) {
    throw new APIError(httpStatus.FORBIDDEN, 'Invalid Refresh Token - logout');
  }

  const tokenDoc = await RefreshTokenModel.findOne({ token }).lean();
  if (!tokenDoc) {
    throw new APIError(httpStatus.FORBIDDEN, 'Invalid Refresh Token - logout');
  }

  return tokenPayload;
};

const rotateRefreshToken = async (token) => {
  const tokenPayload = await verify(token, process.env.JWT_SECRET);

  if (!tokenPayload || tokenPayload.type !== tokenTypes.REFRESH) {
    throw new APIError(httpStatus.FORBIDDEN, 'Invalid Refresh Token - logout');
  }

  const tokenDoc = await RefreshTokenModel.findOne({ token }).lean();
  if (!tokenDoc) {
    throw new APIError(httpStatus.FORBIDDEN, 'Invalid Refresh Token - logout');
  }

  await RefreshTokenModel.findOneAndDelete({ token });

  const tokens = await generateAuthTokens(
    { _id: tokenPayload.userId },
    tokenDoc.device || {}
  );

  return { tokenPayload, tokens };
};

export {
  generateAuthTokens,
  clearRefreshToken,
  verifyRefreshToken,
  rotateRefreshToken,
  generateAccessTokenFromRefreshTokenPayload,
  normalizeDevice,
  buildDeviceFingerprint,
};
