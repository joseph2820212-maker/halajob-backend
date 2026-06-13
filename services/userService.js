import httpStatus from "http-status";
import { UserModel } from "../models/index.js";
import ApiError from "../utils/apiError.js";

const getUserFromId = async (userId) => {
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "Invalid User Id");
  }
  return user;
};

export {
  getUserFromId,
};
