import { UserModel } from '../models/index.js';
import httpStatus from 'http-status';
import APIError from '../utils/apiError.js';
import bcrypt from "bcrypt";

// Helper: normalize email
const normEmail = (e) => (e || '').trim().toLowerCase();

// Helper: is likely email
const isEmail = (v) => v && v.includes('@');

// 1) Create new user
export const createNewUser = async (user) => {
  const email = normEmail(user.email);

  // تأكد من وجود email
  if (!email) {
    throw new APIError(httpStatus.BAD_REQUEST, 'Email is required');
  }

  // منع التكرار
  const exists = await UserModel.exists({ email });
  if (exists) {
    throw new APIError(
      httpStatus.BAD_REQUEST,
      user.lan === 'ar' ? 'الايميل موجود مسبقا' : 'Email already exists'
    );
  }

  // خزّن الايميل lowercase دومًا
  const doc = await UserModel.create({
    ...user,
    email,
  });

  if (!doc) {
    throw new APIError(
      httpStatus.BAD_REQUEST,
      'Oops...seems our server needed a break!'
    );
  }
  return doc;
};

// 2) Google user create
export const createNewGoogleUser = async ({
  id,
  email,
  firstName,
  lastName,
  profilePhoto,
}) => {
  const e = normEmail(email);

  const oldUser = await UserModel.findOne({ email: e }).lean();
  if (oldUser) {
    throw new APIError(httpStatus.BAD_REQUEST, 'Email already exists.');
  }

  const newUser = await UserModel.create({
    email: e,
    source: 'google',
    google_id: id || null,
    first_name: firstName || null,
    last_name: lastName || null,
    avatar: profilePhoto || null,
    status: true,
  });

  if (!newUser) {
    throw new APIError(
      httpStatus.BAD_REQUEST,
      'Oops...seems our server needed a break!'
    );
  }

  return newUser;
};

// 3) Fetch by email & password (login) – يدعم الإيميل أو الهاتف
export const fetchUserFromEmailAndPassword = async ({ email, password }) => {
  const identifier = (email || '').trim();

  let user = null;
  if (isEmail(identifier)) {
    user = await UserModel.findOne({ email: normEmail(identifier) }).lean();
  } else {
    // نتعامل معه كرقم هاتف
    user = await UserModel.findOne({ phone_national: identifier }).lean();
  }

  if (!user) {
    throw new APIError(httpStatus.BAD_REQUEST, 'Invalid credentials');
  }

  // نتوقع أن الحقل user.password موجود (hashed)
  const passwordMatches = await bcrypt.compare(password, user.password);
  if (!passwordMatches) {
    throw new APIError(httpStatus.BAD_REQUEST, 'Invalid credentials');
  }

  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

// 4) Fetch by email (لا ترمي خطأ افتراضيًا — خلّيه اختياري)
export const fetchUserFromEmail = async (email, { throwIfMissing = false } = {}) => {
  const e = normEmail(email);
  const user = await UserModel.findOne({ email: e }).lean();

  if (!user && throwIfMissing) {
    throw new APIError(
      httpStatus.BAD_REQUEST,
      'please sign up - this email does not exist'
    );
  }
  return user; // قد يكون null
};

// 5) Verify user from refresh token payload
export const verifyUserFromRefreshTokenPayload = async ({ userId }) => {
  const userExists = await UserModel.exists({ _id: userId });
  if (!userExists) {
    throw new APIError(httpStatus.FORBIDDEN, 'Invalid Refresh Token - logout');
  }
};

// 6) Fetch by auth data
export const fetchUserFromAuthData = async ({ userId }) => {
  const user = await UserModel.findOne({ _id: userId }).lean();
  if (!user) {
    throw new APIError(httpStatus.UNAUTHORIZED, 'invalid access token user');
  }
  return user;
};

// 7) Verify current password
export const verifyCurrentPassword = async (userId, password) => {
  const user = await UserModel.findOne({ _id: userId }).select('password').lean();
  if (!user?.password) {
    throw new APIError(httpStatus.BAD_REQUEST, 'invalid current password');
  }
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    throw new APIError(httpStatus.BAD_REQUEST, 'invalid current password');
  }
};

// 8) Update password
export const updatePassword = async (userId, newPassword) => {
  const newHash = await bcrypt.hash(newPassword, 10);
  const user = await UserModel.findOneAndUpdate(
    { _id: userId },
    { password: newHash },
    { new: true }
  ).lean();

  if (!user) {
    throw new APIError(httpStatus.NOT_FOUND, 'User not found');
  }
  return true; // أو return user;
};

// 9) Update via array of patches
export const updateUser = async (userId, updatesArray) => {
  const updates = (updatesArray || []).reduce((acc, update) => {
    return { ...acc, ...update };
  }, {});

  const updatedUser = await UserModel.findOneAndUpdate(
    { _id: userId },
    { $set: updates },
    { new: true, runValidators: true }
  ).lean();

  if (!updatedUser) {
    throw new APIError(httpStatus.NOT_FOUND, 'User not found');
  }
  return updatedUser;
};

// 10) Update profile (object)
export const updateUserProfile = async (userId, updates) => {
  const updatedUser = await UserModel.findOneAndUpdate(
    { _id: userId },
    { $set: updates },
    { new: true, runValidators: true }
  ).lean();

  if (!updatedUser) {
    throw new APIError(httpStatus.NOT_FOUND, 'User not found');
  }
  return updatedUser;
};

// 11) Delete user
export const deleteUser = async (userId) => {
  const deleted = await UserModel.findByIdAndDelete(userId).lean();
  if (!deleted) {
    throw new APIError(httpStatus.NOT_FOUND, 'User not found');
  }
  return deleted;
};
