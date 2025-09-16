import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const refreshTokenSchema = new mongoose.Schema({
  userRef: {
    type: String,
    ref: 'users',                      //The $ref field holds the name of the collection where the referenced document resides.
    required: true,
    index: true,
  },
  loginTime: {
    type: Date,
    required: true,
  },
  device:{
    type:Object,
  },
  token: {
    type: String,
    required: true,
    index: true,
  },
});

const RefreshTokenModel = mongoose.model('RefreshToken', refreshTokenSchema);

export default RefreshTokenModel;
