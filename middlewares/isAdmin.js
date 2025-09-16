import APIError from '../utils/apiError.js';
import { UserModel, RefreshTokenModel } from '../models/index.js';
import httpStatus from 'http-status';
import { tokenTypes } from '../config/tokens.js';
import { verify } from '../utils/jwtHelpers.js';

const isAdmin = async (req, res, next) => {
  try {
    // Extract Authorization header
    const authHeader = req.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new APIError(httpStatus.UNAUTHORIZED, 'Authorization header missing or malformed');
    }

    // Extract the token from the header
    const accessToken = authHeader.split(' ')[1];
    if (!accessToken) {
      throw new APIError(httpStatus.UNAUTHORIZED, 'Access token missing');
    }

    // Debugging: Log token
    console.log('Received Access Token:', accessToken);

    // Verify the token
    const tokenPayload = await verify(accessToken, process.env.JWT_SECRET);
    if (!tokenPayload) {
      throw new APIError(httpStatus.UNAUTHORIZED, 'Invalid or expired access token');
    }

    // Debugging: Log payload
    console.log('Token Payload:', tokenPayload);

    // Check if the token is of the correct type
    if (tokenPayload.type !== tokenTypes.ACCESS) {
      throw new APIError(httpStatus.UNAUTHORIZED, 'Token type is invalid');
    }

    // Validate the user exists
    const userExists = await UserModel.exists({ _id: tokenPayload.userId,is_admin:process.env.Admin_Hash,user_type:"admin" });
  
    if (!userExists) {
      throw new APIError(httpStatus.FORBIDDEN, process.env.Admin_Hash);
    }

    // Validate the refresh token exists for the user and login time
    const refreshTokenExists = await RefreshTokenModel.exists({
      userRef: tokenPayload.userId,
      loginTime: tokenPayload.loginTime,
    });

    if (!refreshTokenExists) {
      throw new APIError(httpStatus.FORBIDDEN, 'Session expired. Please log in again.');
    }

    // Attach the payload to the request object
    req.authData = userExists;

    // Debugging: Log success
    console.log('User authenticated successfully:', tokenPayload);
    // Proceed to the next middleware or route handler
    next();
  } catch (error) {
    // Log the error for debugging
    console.error('Authentication error:', error.message);
    next(error); // Pass the error to the error-handling middleware
  }
};

export { isAdmin };
