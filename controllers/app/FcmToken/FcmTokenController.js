// controllers/app/FcmToken/FcmTokenController.js
import {
  getUserTokens, saveOrUpdateFcmToken,
   revokeTokenById, updateTokenById
} from '../../../services/fcmTokens.js';

const parseIntBounded = (value, fallback, min, max) => {
  const n = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
};

export default {
  async listTokens(req, res, next) {
    try {
      const userId = req.user._id;
      const onlyValid = req.query.onlyValid !== 'false';
      const limit = parseIntBounded(req.query.limit, 50, 1, 100);
      const cursor = req.query.cursor || null; // ISO date أو _id

      const { items, nextCursor } = await getUserTokens(userId, { onlyValid, limit, cursor });
      res.json({ items, nextCursor });
    } catch (e) { next(e); }
  },

  async registerToken(req, res, next) {
    try {
      const userId = req.user._id;
      const {
        token, platform, deviceId, brand,
        model_name, model_id, build_id,
        is_default = false, topics = []
      } = req.body;
      const lang = (req.get('lan') || 'en').toLowerCase();

      const { doc, created } = await saveOrUpdateFcmToken({
        userId, token, platform, deviceId, brand,
        model_name, model_id, build_id, is_default, lang, topics
      });

      res.status(created ? 201 : 200).json(doc);
    } catch (e) {
      if (e.status) return res.status(e.status).json({ error: e.message });
      if (e.message === 'حقول مطلوبة') return res.status(400).json({ error: e.message });
      next(e);
    }
  },

  async updateToken(req, res, next) {
    try {
      const userId = req.user._id;
      const id = req.params.id;
      const payload = {};

      if (typeof req.body.is_default === 'boolean') payload.is_default = req.body.is_default;
      if (typeof req.body.revoked === 'boolean') payload.revoked = req.body.revoked;
      if (Array.isArray(req.body.topics)) payload.topics = req.body.topics;

      const doc = await updateTokenById(userId, id, payload);
      res.json(doc);
    } catch (e) {
      if (e.status) return res.status(e.status).json({ error: e.message });
      next(e);
    }
  },

  async deleteToken(req, res, next) {
    try {
      const userId = req.user._id;
      const id = req.params.id;
      await revokeTokenById(userId, id); // أو حذف فعلي
      res.status(204).end();
    } catch (e) {
      if (e.status) return res.status(e.status).json({ error: e.message });
      next(e);
    }
  }
};
