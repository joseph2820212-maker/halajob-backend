// services/fcmTokens.js
import { FcmTokenModel } from '../models/index.js';

export async function saveOrUpdateFcmToken(input) {
  const {
    userId, token, platform, deviceId, brand,
    model_name, model_id, build_id, is_default = false,
    lang = 'en', topics = []
  } = input;

  if (!userId || !token || !platform || !model_name) throw new Error('حقول مطلوبة');

  const existingByToken = await FcmTokenModel.findOne({ token });

  if (existingByToken && String(existingByToken.user) !== String(userId)) {
    const err = new Error('هذا التوكن مرتبط بحساب آخر');
    err.status = 409;
    throw err;
  }

  if (is_default) {
    await FcmTokenModel.updateMany({ user: userId }, { $set: { is_default: false } });
  }

  const filter = existingByToken
    ? { _id: existingByToken._id }
    : { user: userId, device_id: deviceId || null };

  const before = await FcmTokenModel.findOne(filter).select('_id');
  const doc = await FcmTokenModel.findOneAndUpdate(
    filter,
    {
      $set: {
        token, platform, device_id: deviceId || null, brand: brand || null,
        model_name, model_id: model_id || null, build_id: build_id || null,
        is_default, lang, topics, revoked: false, last_seen_at: new Date(), last_error: null
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return { doc: doc.toObject(), created: !before };
}

export async function getUserTokens(userId, { onlyValid = true, limit = 50, cursor = null } = {}) {
  const q = { user: userId };
  if (onlyValid) q.revoked = false;
  if (cursor) q.last_seen_at = { $lt: new Date(cursor) };

  const items = await FcmTokenModel.find(q)
    .sort({ last_seen_at: -1, _id: -1 })
    .limit(limit)
    .lean();

  const nextCursor = items.length === limit ? items[items.length - 1].last_seen_at.toISOString() : null;
  return { items, nextCursor };
}

export async function updateTokenById(userId, id, payload) {
  if (payload.is_default === true) {
    await FcmTokenModel.updateMany({ user: userId }, { $set: { is_default: false } });
  }
  const doc = await FcmTokenModel.findOneAndUpdate(
    { _id: id, user: userId },
    { $set: payload },
    { new: true }
  );
  if (!doc) { const e = new Error('غير موجود'); e.status = 404; throw e; }
  return doc.toObject();
}

export async function revokeTokenById(userId, id) {
  const doc = await FcmTokenModel.findOneAndUpdate(
    { _id: id, user: userId },
    { $set: { revoked: true } }
  );
  if (!doc) { const e = new Error('غير موجود'); e.status = 404; throw e; }
}
