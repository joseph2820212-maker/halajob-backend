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

// Only match ACTIVE rows so we never overwrite a retired row's audit
// record. Retired rows must stay put (with is_active:false) so a later
// replay of the same JWT can be detected in rotateRefreshToken.
const buildDeviceQuery = (userId, device = {}) => {
  const normalized = normalizeDevice(device);

  return {
    userRef: userId,
    'device.brand': normalized.brand,
    'device.model_name': normalized.model_name,
    'device.is_device': normalized.is_device,
    is_active: true,
  };
};

const generateToken = async (userId, loginTime, expires, type, jti) => {
  const payload = {
    userId,
    loginTime: new Date(loginTime.valueOf()),
    exp: expires.unix(),
    type,
    jti: jti || crypto.randomUUID(),
  };

  return sign(payload, process.env.JWT_SECRET);
};

// Decode a refresh token to recover its jti/userId without re-verifying
// signature (the caller already verified).
const decodeJti = async (token) => {
  const payload = await verify(token, process.env.JWT_SECRET);
  return payload;
};

// Save the row for a freshly-issued refresh token.
// - If familyId is null we generate a new family (fresh login).
// - If familyId is set we're rotating; caller is responsible for retiring
//   the previous row before calling this.
const saveRefreshToken = async (
  userId,
  loginTime,
  token,
  device = {},
  expiresAt,
  familyId,
  jti,
) => {
  const normalizedDevice = normalizeDevice(device);
  const deviceFingerprint = buildDeviceFingerprint(normalizedDevice);
  const tokenExpiresAt = expiresAt
    ? new Date(expiresAt.valueOf ? expiresAt.valueOf() : expiresAt)
    : new Date(
        Date.now() +
          Number(process.env.REFRESH_TOKEN_EXPIRATION_DAYS || 30) *
            24 *
            60 *
            60 *
            1000,
      );

  const resolvedFamilyId = familyId || crypto.randomUUID();

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
        family_id: resolvedFamilyId,
        jti,
        is_active: true,
        retired_at: null,
      },
      $setOnInsert: {
        created_at: new Date(),
      },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    },
  );

  return { familyId: resolvedFamilyId };
};

const clearRefreshToken = async (token) => {
  if (!token) return;
  await RefreshTokenModel.findOneAndDelete({ token });
};

const generateAuthTokens = async (user, device = {}, opts = {}) => {
  const loginTime = moment();
  const refreshTokenExpiresAt = loginTime
    .clone()
    .add(Number(process.env.REFRESH_TOKEN_EXPIRATION_DAYS || 30), 'days');

  const accessJti = crypto.randomUUID();
  const refreshJti = crypto.randomUUID();

  const accessToken = await generateToken(
    user._id,
    loginTime,
    loginTime
      .clone()
      .add(Number(process.env.ACCESS_TOKEN_EXPIRATION_MINUTES || 30), 'minutes'),
    tokenTypes.ACCESS,
    accessJti,
  );

  const refreshToken = await generateToken(
    user._id,
    loginTime,
    refreshTokenExpiresAt,
    tokenTypes.REFRESH,
    refreshJti,
  );

  await saveRefreshToken(
    user._id,
    loginTime,
    refreshToken,
    device,
    refreshTokenExpiresAt,
    opts.familyId || null,
    refreshJti,
  );

  return {
    accessToken,
    refreshToken,
  };
};

const generateAccessTokenFromRefreshTokenPayload = async ({ userId, loginTime }) => {
  const now = moment();
  const accessTokenExpiresAt = now.clone().add(
    Number(process.env.ACCESS_TOKEN_EXPIRATION_MINUTES || 30),
    'minutes',
  );

  return generateToken(
    userId,
    moment(loginTime),
    accessTokenExpiresAt,
    tokenTypes.ACCESS,
  );
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

  // A row that's been rotated out is not valid. If someone is presenting it
  // to verifyRefreshToken they either kept a stale reference or the token
  // has been stolen — the safer read is "revoke everything in this family".
  if (tokenDoc.is_active === false) {
    if (tokenDoc.family_id) {
      await RefreshTokenModel.deleteMany({
        userRef: tokenDoc.userRef,
        family_id: tokenDoc.family_id,
      });
    }
    throw new APIError(
      httpStatus.FORBIDDEN,
      'Refresh token reuse detected - session revoked',
    );
  }

  return tokenPayload;
};

// Rotate a refresh token: retire the current row, issue a new one on the
// same family. Reuse detection: if the presented token maps to a row that
// was already rotated (is_active: false), every row in the family is
// deleted and the caller is forced to re-authenticate.
//
// Race safety: the retire step uses a CONDITIONAL updateOne (is_active:true
// in the filter) so two concurrent legitimate rotations both hit the DB but
// only ONE modifies the row. The loser sees modifiedCount === 0 and takes
// the "already retired" branch, which triggers reuse detection and kills
// the family. That's the correct outcome — if two callers hold the same
// token and both try to rotate, they can't both continue.
const rotateRefreshToken = async (token) => {
  const tokenPayload = await verify(token, process.env.JWT_SECRET);

  if (!tokenPayload || tokenPayload.type !== tokenTypes.REFRESH) {
    throw new APIError(httpStatus.FORBIDDEN, 'Invalid Refresh Token - logout');
  }

  const tokenDoc = await RefreshTokenModel.findOne({ token });
  if (!tokenDoc) {
    throw new APIError(httpStatus.FORBIDDEN, 'Invalid Refresh Token - logout');
  }

  // ==== Reuse detection (path 1: row already retired at read time) ====
  // The presented token maps to a row that has already been rotated out
  // by an earlier request. Kill the whole family.
  if (tokenDoc.is_active === false) {
    if (tokenDoc.family_id) {
      await RefreshTokenModel.deleteMany({
        userRef: tokenDoc.userRef,
        family_id: tokenDoc.family_id,
      });
    } else {
      await RefreshTokenModel.findOneAndDelete({ _id: tokenDoc._id });
    }
    throw new APIError(
      httpStatus.FORBIDDEN,
      'Refresh token reuse detected - session revoked',
    );
  }

  // Legacy row without a family_id (pre-migration): back-fill by starting a
  // new family. Otherwise carry the family_id forward.
  const familyId = tokenDoc.family_id || crypto.randomUUID();

  // Conditional retire — only proceeds if the row is still active. If a
  // concurrent rotate has already flipped is_active to false, modifiedCount
  // is 0 and we fall through to the reuse-detection branch below.
  const retireResult = await RefreshTokenModel.updateOne(
    { _id: tokenDoc._id, is_active: true },
    {
      $set: {
        is_active: false,
        retired_at: new Date(),
        family_id: familyId,
      },
    },
  );

  // ==== Reuse detection (path 2: lost the retire race) ====
  // Another rotation of the same token beat us to the retire step. The
  // presented token is being used twice — kill the whole family.
  if (retireResult.modifiedCount !== 1) {
    await RefreshTokenModel.deleteMany({
      userRef: tokenDoc.userRef,
      family_id: familyId,
    });
    throw new APIError(
      httpStatus.FORBIDDEN,
      'Refresh token reuse detected - session revoked',
    );
  }

  const tokens = await generateAuthTokens(
    { _id: tokenPayload.userId },
    tokenDoc.device || {},
    { familyId },
  );

  return { tokenPayload, tokens };
};

// Revoke every session in the caller's family — used from a "logout
// everywhere" endpoint. Prefer this over deleting a single row because
// once we're keeping retired rows for reuse detection, a single delete
// leaves the family alive.
const revokeRefreshFamily = async (familyId) => {
  if (!familyId) return;
  await RefreshTokenModel.deleteMany({ family_id: familyId });
};

export {
  generateAuthTokens,
  clearRefreshToken,
  verifyRefreshToken,
  rotateRefreshToken,
  revokeRefreshFamily,
  generateAccessTokenFromRefreshTokenPayload,
  normalizeDevice,
  buildDeviceFingerprint,
  decodeJti,
};
