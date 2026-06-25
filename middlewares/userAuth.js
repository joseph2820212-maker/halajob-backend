import ApiError from '../utils/apiError.js';
import { UserModel, RefreshTokenModel } from '../models/index.js';
import httpStatus from 'http-status';
import { tokenTypes } from '../config/tokens.js';
import { verify } from '../utils/jwtHelpers.js';
import { resolveActiveContextForUser } from '../services/accountContext.service.js';

const authUser = async (req, res, next) => {
  try {
    // Extract Authorization header
    const authHeader = req.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Authorization header missing or malformed');
    }

    // Extract the token from the header
    const accessToken = authHeader.split(' ')[1];
    if (!accessToken) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Access token missing');
    }

    const tokenPayload = await verify(accessToken, process.env.JWT_SECRET);
    if (!tokenPayload) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid or expired access token');
    }

    // Check if the token is of the correct type
    if (tokenPayload.type !== tokenTypes.ACCESS) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Token type is invalid');
    }

    // Validate the user exists
    const user = await UserModel.findById(tokenPayload.userId.toString())
      .select('-password -passcode -another_device_code -pending_device -device')
      .lean();
    // const userExists = await UserModel.exists({ _id: tokenPayload.userId,status:true,user_type: { $in: ["admin", "representative"] } });
    if (!user) {
      throw new ApiError(httpStatus.FORBIDDEN, 'User not found. Please log in again.');
    }
 
    // Validate the refresh token exists for the user and login time
    const refreshTokenExists = await RefreshTokenModel.exists({
      userRef: tokenPayload.userId,
      loginTime: tokenPayload.loginTime,
    });
    if (!refreshTokenExists) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Session expired. Please log in again.');
    }

    // Attach the payload to the request object
    req.user = user;
    req.activeContext = await resolveActiveContextForUser(
      user,
      req.get('X-Active-Context-Id') || req.get('active_context_id')
    );
   
    req.authHeader = accessToken;
    // Proceed to the next middleware or route handler
    next();
  } catch (error) {
    next(error);
  }
};

export { authUser };
