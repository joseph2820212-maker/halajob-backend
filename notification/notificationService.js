import mongoose from 'mongoose';
import { FcmTokenModel, NotificationModel, UserModel } from '../models/index.js';
import { sendToTokens } from './SendNotification.js';
import { buildDashboardTarget } from './dashboardRoutes.js';
import { renderNotificationText, routeForEvent } from './notificationCatalog.js';

const VALID_LANGS = new Set(['ar', 'en']);
const DEFAULT_LANG = 'en';
const MAX_BATCH_SIZE = 500;

const toStr = (value) => (value === undefined || value === null ? '' : String(value));
const cleanId = (value) => String(value?._id || value || '').trim();
const isObjectId = (value) => mongoose.Types.ObjectId.isValid(cleanId(value));

const chunk = (arr, size = MAX_BATCH_SIZE) => {
  const output = [];
  for (let i = 0; i < arr.length; i += size) output.push(arr.slice(i, i + size));
  return output;
};

const stringifyData = (data = {}) => {
  const out = {};
  Object.entries(data || {}).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (value instanceof Date) out[key] = value.toISOString();
    else if (typeof value === 'object') out[key] = JSON.stringify(value);
    else out[key] = String(value);
  });
  return out;
};

const revokeBadTokens = async (tokens = [], responses = []) => {
  const badCodes = new Set([
    'messaging/registration-token-not-registered',
    'messaging/invalid-registration-token',
    'messaging/invalid-argument',
  ]);

  const badTokens = responses
    .map((response, index) => (!response?.success && badCodes.has(response?.error?.code) ? tokens[index] : null))
    .filter(Boolean);

  if (!badTokens.length) return 0;

  await FcmTokenModel.updateMany(
    { token: { $in: badTokens } },
    { $set: { revoked: true, last_error: 'token_invalid' } }
  );

  return badTokens.length;
};

const getUserLanguage = async (userId, explicitLang) => {
  const lang = String(explicitLang || '').toLowerCase();
  if (VALID_LANGS.has(lang)) return lang;

  if (!userId || !isObjectId(userId)) return DEFAULT_LANG;
  const user = await UserModel.findById(userId).select('lan').lean().catch(() => null);
  return VALID_LANGS.has(user?.lan) ? user.lan : DEFAULT_LANG;
};

const getActiveTokenDocs = async (userId) => {
  if (!userId || !isObjectId(userId)) return [];
  return FcmTokenModel.find({ user: userId, revoked: false }).select('token lang platform').lean();
};

const saveNotification = async ({ userId, payload, dedupeKey }) => {
  if (!userId || !isObjectId(userId)) return null;

  if (dedupeKey) {
    return NotificationModel.findOneAndUpdate(
      { user_id: userId, dedupeKey },
      { $setOnInsert: payload },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();
  }

  return NotificationModel.create(payload);
};

export async function notifyUser({
  userId,
  eventKey,
  audience,
  routeKey,
  routeParams = {},
  lang,
  title,
  body,
  params = {},
  data = {},
  imageUrl = null,
  dedupeKey = null,
  save = true,
  push = true,
} = {}) {
  try {
    const normalizedUserId = cleanId(userId);
    if (!normalizedUserId || !isObjectId(normalizedUserId)) {
      return { saved: null, success: 0, failure: 0, revoked: 0, note: 'invalid_or_missing_user_id' };
    }

    const userLang = await getUserLanguage(normalizedUserId, lang);
    const route = routeForEvent(eventKey, { audience, routeKey });
    const finalAudience = audience || route.audience || 'employee';
    const finalRouteKey = routeKey || route.routeKey || 'dashboard';
    const target = buildDashboardTarget(finalAudience, finalRouteKey, routeParams);
    const rendered = renderNotificationText(eventKey, userLang, params);

    const finalTitle = title || rendered.title || eventKey || 'JobZain';
    const finalBody = body || rendered.body || '';

    const finalData = {
      event: eventKey || '',
      audience: finalAudience,
      route_key: target.route_key,
      route_path: target.route_path,
      target_url: target.target_url,
      url: target.target_url,
      deeplink: target.target_url,
      ...stringifyData(data),
    };

    const notificationPayload = {
      user_id: normalizedUserId,
      title: finalTitle,
      body: finalBody,
      screen: target.route_key,
      route_key: target.route_key,
      route_path: target.route_path,
      target_url: target.target_url,
      url: target.target_url,
      imageUrl: imageUrl || undefined,
      type: eventKey || 'notification',
      audience: finalAudience,
      data: finalData,
      dedupeKey: dedupeKey || undefined,
    };

    let savedNotification = null;
    if (save) savedNotification = await saveNotification({ userId: normalizedUserId, payload: notificationPayload, dedupeKey });

    if (!push) {
      return { saved: savedNotification?._id || savedNotification?.id || null, success: 0, failure: 0, revoked: 0, note: 'push_disabled' };
    }

    const tokenDocs = await getActiveTokenDocs(normalizedUserId);
    const tokens = [...new Set(tokenDocs.map((doc) => doc.token).filter(Boolean))];

    if (!tokens.length) {
      return { saved: savedNotification?._id || savedNotification?.id || null, success: 0, failure: 0, revoked: 0, note: 'no_tokens' };
    }

    let success = 0;
    let failure = 0;
    let revoked = 0;

    for (const batch of chunk(tokens)) {
      const response = await sendToTokens(batch, {
        title: finalTitle,
        body: finalBody,
        screen: target.route_key,
        id: data?.job_id || data?.application_id || data?.interview_id || data?.invitation_id || routeParams?.id || '',
        imageUrl: imageUrl || undefined,
        extraData: finalData,
      });

      success += response?.successCount || 0;
      failure += response?.failureCount || 0;
      revoked += await revokeBadTokens(batch, response?.responses || []);
    }

    return { saved: savedNotification?._id || savedNotification?.id || null, success, failure, revoked };
  } catch (error) {
    console.error('notifyUser error', {
      eventKey,
      userId: cleanId(userId),
      message: error?.message,
    });
    return { saved: null, success: 0, failure: 0, revoked: 0, error: String(error?.message || error) };
  }
}

export const fireAndForgetNotification = (payload) => {
  notifyUser(payload).catch((error) => console.error('fireAndForgetNotification error', error));
};

export const applicationStatusEventKey = (status = '') => {
  const value = String(status || '').trim().toLowerCase();
  return `application_status_${value || 'waiting'}`;
};

export function candidateNameFrom(value = {}) {
  return [
    value.first_name || value.user_id?.first_name || value.user?.first_name,
    value.mid_name || value.user_id?.mid_name || value.user?.mid_name,
    value.last_name || value.user_id?.last_name || value.user?.last_name,
  ].filter(Boolean).join(' ') || value.email || 'Candidate';
}

export function jobNameFrom(value = {}) {
  return value.job_name || value.title || value.job_id?.job_name || value.job?.job_name || 'Job';
}

export default {
  notifyUser,
  fireAndForgetNotification,
  applicationStatusEventKey,
  candidateNameFrom,
  jobNameFrom,
};
