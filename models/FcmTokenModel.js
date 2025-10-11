// models/fcmToken.js
import mongoose from 'mongoose';

const fcmTokenSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true, index: true },

  token: { type: String, required: true, unique: true, index: true }, // فريد

  platform: { type: String, enum: ['android','ios','web'], required: true },
  device_id: { type: String, index: true }, // ANDROID_ID / IDFV
  brand: String,
  model_name: { type: String, required: true },
  model_id: { type: String, default: null },
  build_id: String,

  is_default: { type: Boolean, default: false },
  lang: { type: String, enum: ['ar','en'], default: 'en' },

  revoked: { type: Boolean, default: false },
  last_seen_at: { type: Date, default: Date.now },
  last_error: { type: String, default: null },

  topics: { type: [String], default: [] }
}, { collection: 'fcm_tokens', timestamps: true });

// جهاز واحد للمستخدم بحد أقصى (اختياري)
fcmTokenSchema.index({ user: 1, device_id: 1 }, { unique: true, sparse: true });

export const FcmTokenModel = mongoose.model('FcmToken', fcmTokenSchema);
export default FcmTokenModel;
