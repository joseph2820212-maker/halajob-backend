// server.js (ESM)
import admin from 'firebase-admin';
import serviceAccount from './jobzain-firebase-adminsdk-fbsvc-23f2077871.json' with { type: 'json' };

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const messaging = admin.messaging();

// helpers
const toStr = v => (v === undefined || v === null) ? undefined : String(v);
const buildDeeplink = (screen, id) =>
  screen ? `myapp://${screen}${id ? `/${id}` : ''}` : undefined;

// يبني الحقول المشتركة لكل الرسائل
function buildCommonPayload({ title, body, screen, id, imageUrl, extraData = {} } = {}) {
  // data نصوص فقط
  const data = {
    screen: toStr(screen),
    id: toStr(id),
    deeplink: buildDeeplink(screen, id),
    image_url: toStr(imageUrl),
    ...Object.fromEntries(
      Object.entries(extraData).map(([k, v]) => [k, toStr(v)])
    ),
  };
  // إزالة المفاتيح غير المعرّفة
  Object.keys(data).forEach(k => data[k] === undefined && delete data[k]);

  // إرفاق الصورة في طبقات المنصات عند توفرها
  const platformImages = imageUrl
    ? {
        android: { notification: { imageUrl } },
        apns: { payload: { aps: {} }, fcm_options: { image: imageUrl } },
      }
    : {};

  return {
    notification: { title: title ?? 'تنبيه', body: body ?? 'افتح للاطلاع' },
    data,
    ...platformImages,
  };
}

/**
 * 1) إرسال لتوكن واحد
 */
export async function sendToToken(token, params = {}) {
  const common = buildCommonPayload(params);
  const message = { token, ...common };
  const res = await messaging.send(message);
  console.log('sendToToken ->', res);
  return res;
}

/**
 * 2) إرسال لمجموعة توكنات (≤ 500 توكن لكل طلب)
 */
export async function sendToTokens(tokens = [], params = {}) {
  if (!Array.isArray(tokens) || tokens.length === 0) throw new Error('tokens[] مطلوب');
  const common = buildCommonPayload(params);
  const message = { tokens, ...common };
  const res = await messaging.sendEachForMulticast(message);
  console.log(`sendToTokens -> success: ${res.successCount}, failure: ${res.failureCount}`);
  if (res.failureCount > 0) {
    res.responses.forEach((r, i) => {
      if (!r.success) console.warn('Failed token:', tokens[i], r.error?.code, r.error?.message);
    });
  }
  return res;
}

/**
 * 3) إرسال لموضوع Topic
 */
export async function sendToTopic(topic, params = {}) {
  const common = buildCommonPayload(params);
  const message = { topic, ...common };
  const res = await messaging.send(message);
  console.log('sendToTopic ->', res);
  return res;
}

/**
 * 4) إرسال بشرط Condition
 */
export async function sendToCondition(condition, params = {}) {
  const common = buildCommonPayload(params);
  const message = { condition, ...common };
  const res = await messaging.send(message);
  console.log('sendToCondition ->', res);
  return res;
}

/* إدارة الاشتراكات في Topics */
export async function subscribeTokensToTopic(tokens = [], topic) {
  if (!Array.isArray(tokens) || tokens.length === 0) throw new Error('tokens[] مطلوب');
  const res = await messaging.subscribeToTopic(tokens, topic);
  console.log('subscribeTokensToTopic ->', res);
  return res;
}

export async function unsubscribeTokensFromTopic(tokens = [], topic) {
  if (!Array.isArray(tokens) || tokens.length === 0) throw new Error('tokens[] مطلوب');
  const res = await messaging.unsubscribeFromTopic(tokens, topic);
  console.log('unsubscribeTokensFromTopic ->', res);
  return res;
}

export default {
  sendToToken,
  sendToTokens,
  sendToTopic,
  sendToCondition,
  subscribeTokensToTopic,
  unsubscribeTokensFromTopic,
};
