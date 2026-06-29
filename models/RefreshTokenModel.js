import mongoose from 'mongoose';

const refreshTokenSchema = new mongoose.Schema({
  userRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: true,
    index: true,
  },
  loginTime: {
    type: Date,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  device:{
    type:Object,
  },
  token: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
}, { timestamps: true });

refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const RefreshTokenModel = mongoose.model('RefreshToken', refreshTokenSchema);

export default RefreshTokenModel;
