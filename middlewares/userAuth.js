import APIError from '../utils/apiError.js';
import { UserModel, RefreshTokenModel } from '../models/index.js';
import httpStatus from 'http-status';
import { tokenTypes } from '../config/tokens.js';
import { verify } from '../utils/jwtHelpers.js';

const authUser = async (req, res, next) => {
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
    const user = await UserModel.findById(tokenPayload.userId.toString()).lean();
    // const userExists = await UserModel.exists({ _id: tokenPayload.userId,status:true,user_type: { $in: ["admin", "representative"] } });
    if (!user) {
      throw new APIError(httpStatus.FORBIDDEN, 'User not found. Please log in again.');
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
    req.user = user;
   
    req.authHeader = accessToken;
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

export { authUser };
