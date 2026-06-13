import fs from 'fs';
import path from 'path';
import admin from 'firebase-admin';

const readJsonFile = (filePath) => {
  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) return null;
  return JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
};

const normalizePrivateKey = (credential) => {
  if (credential?.private_key) {
    credential.private_key = String(credential.private_key).replace(/\\n/g, '\n');
  }
  return credential;
};

const loadFirebaseCredential = () => {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return normalizePrivateKey(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON));
  }

  const credentialPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (credentialPath) {
    const credential = readJsonFile(credentialPath);
    if (credential) return normalizePrivateKey(credential);
  }

  return null;
};

let messagingInstance;

const getMessaging = () => {
  if (messagingInstance) return messagingInstance;

  const credential = loadFirebaseCredential();
  if (!credential) {
    throw new Error('firebase_service_account_missing');
  }

  if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(credential) });
  }

  messagingInstance = admin.messaging();
  return messagingInstance;
};

const toStr = (value) => (value === undefined || value === null ? undefined : String(value));
const buildDeeplink = (screen, id) => (screen ? `myapp://${screen}${id ? `/${id}` : ''}` : undefined);

function buildCommonPayload({ title, body, screen, id, imageUrl, extraData = {} } = {}) {
  const data = {
    screen: toStr(screen),
    id: toStr(id),
    deeplink: buildDeeplink(screen, id),
    image_url: toStr(imageUrl),
    ...Object.fromEntries(Object.entries(extraData).map(([key, value]) => [key, toStr(value)])),
  };

  Object.keys(data).forEach((key) => data[key] === undefined && delete data[key]);

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

export async function sendToToken(token, params = {}) {
  const message = { token, ...buildCommonPayload(params) };
  return getMessaging().send(message);
}

export async function sendToTokens(tokens = [], params = {}) {
  if (!Array.isArray(tokens) || tokens.length === 0) throw new Error('tokens_required');
  const message = { tokens, ...buildCommonPayload(params) };
  return getMessaging().sendEachForMulticast(message);
}

export async function sendToTopic(topic, params = {}) {
  const message = { topic, ...buildCommonPayload(params) };
  return getMessaging().send(message);
}

export async function sendToCondition(condition, params = {}) {
  const message = { condition, ...buildCommonPayload(params) };
  return getMessaging().send(message);
}

export async function subscribeTokensToTopic(tokens = [], topic) {
  if (!Array.isArray(tokens) || tokens.length === 0) throw new Error('tokens_required');
  return getMessaging().subscribeToTopic(tokens, topic);
}

export async function unsubscribeTokensFromTopic(tokens = [], topic) {
  if (!Array.isArray(tokens) || tokens.length === 0) throw new Error('tokens_required');
  return getMessaging().unsubscribeFromTopic(tokens, topic);
}

export default {
  sendToToken,
  sendToTokens,
  sendToTopic,
  sendToCondition,
  subscribeTokensToTopic,
  unsubscribeTokensFromTopic,
};
