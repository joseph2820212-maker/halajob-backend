import { sign, verify } from '../utils/jwtHelpers.js';
import { tokenTypes } from '../config/tokens.js';

import { RefreshTokenModel } from '../models/index.js';
import moment from 'moment';
import httpStatus from 'http-status';

import APIError from '../utils/apiError.js';

const generateToken = async (userId, loginTime, expires, type) => {
  const payload = {
    userId,
    loginTime: new Date(loginTime.valueOf()),
    exp: expires.unix(),
    type,
   };
   let token = await sign(payload, process.env.JWT_SECRET);
   return token;
};

const saveRefreshToken = async (userId, loginTime, token, device) => {
  await RefreshTokenModel.findOneAndUpdate(
    { userRef: userId, device }, // ابحث عن نفس المستخدم ونفس الجهاز
    {
      loginTime: new Date(loginTime.valueOf()),
      token: token,
    },
    {
      upsert: true, // أنشئ إذا لم يوجد
      new: true,
      setDefaultsOnInsert: true
    }
  );
};

const clearRefreshToken = async (token) => {
  await RefreshTokenModel.findOneAndDelete({ token: token });
};

const generateAuthTokens = async (user, device) => {
  const loginTime = moment();

  const accessToken = await generateToken(
    user._id,
    loginTime,
    loginTime.clone().add(process.env.ACCESS_TOKEN_EXPIRATION_MINUTES, 'minutes'),
    tokenTypes.ACCESS
  );

  const refreshToken = await generateToken(
    user._id,
    loginTime,
    loginTime.clone().add(process.env.REFRESH_TOKEN_EXPIRATION_DAYS, 'days'),
    tokenTypes.REFRESH
  );

  await saveRefreshToken(user._id, loginTime, refreshToken, device);

  return {
    accessToken,
    refreshToken
  };
};
 


const generateAccessTokenFromRefreshTokenPayload = async ({
  userId,
  loginTime,
  platform,
}) => {
  const now = moment();
  let accessTokenExpiresAt = now.add(
    process.env.ACCESS_TOKEN_EXPIRATION_MINUTES,
    'minutes'
  );

  const accessToken = await generateToken(
    userId,
    moment(loginTime),
    accessTokenExpiresAt,
    tokenTypes.ACCESS,
    platform
  );

  return accessToken;
};

const verifyRefreshToken = async (token) => {
  let tokenPayload = await verify(token, process.env.JWT_SECRET);
  if (!tokenPayload || tokenPayload.type !== tokenTypes.REFRESH)
    throw new APIError(httpStatus.FORBIDDEN, 'Invalid Refresh Token - logout');

  let tokenDoc = await RefreshTokenModel.findOne({ token });
  if (!tokenDoc)
    throw new APIError(httpStatus.FORBIDDEN, 'Invalid Refresh Token - logout');

  return tokenPayload;
};


export {
  generateAuthTokens,
  clearRefreshToken,
  verifyRefreshToken,
  generateAccessTokenFromRefreshTokenPayload,
 };
