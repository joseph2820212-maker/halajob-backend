import mongoose from "mongoose";
import {
  CommunicationDeliveryLogModel,
  UserModel,
} from "../../models/index.js";
import {
  communicationChannelAllowed,
  categoryForNotificationEvent,
} from "../notifications/notificationPreference.service.js";
import { sendEmailChannel } from "./channels/emailChannel.js";
import { sendInAppChannel } from "./channels/inAppChannel.js";
import { sendManualWhatsappChannel } from "./channels/manualWhatsappChannel.js";
import { sendPushChannel } from "./channels/pushChannel.js";
import { sendSmsChannel } from "./channels/smsChannel.js";

export const COMMUNICATION_CHANNELS = [
  "in_app",
  "push",
  "email",
  "sms",
  "manual_whatsapp",
  "whatsapp_business",
];

const clean = (value = "") => String(value || "").trim();
const cleanId = (value) => clean(value?._id || value);
const objectIdOrNull = (value) => {
  const id = cleanId(value);
  return mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null;
};

const normalizeChannel = (value = "") => {
  const channel = clean(value).toLowerCase();
  if (channel === "whatsapp") return "manual_whatsapp";
  return COMMUNICATION_CHANNELS.includes(channel) ? channel : "";
};

export const normalizeCommunicationChannels = (channels) => {
  if (!channels) return ["in_app"];
  if (Array.isArray(channels)) {
    return [...new Set(channels.map(normalizeChannel).filter(Boolean))];
  }
  if (typeof channels === "string") {
    return normalizeCommunicationChannels(channels.split(/[,\s]+/));
  }
  if (typeof channels === "object") {
    return [
      ...new Set(
        Object.entries(channels)
          .filter(([, enabled]) => enabled === true || enabled === "true" || enabled === 1 || enabled === "1")
          .map(([key]) => normalizeChannel(key))
          .filter(Boolean),
      ),
    ];
  }
  return ["in_app"];
};

const recipientForChannel = ({ channel, user = {}, preferences = {}, variables = {} }) => {
  if (channel === "email") return clean(user.email || variables.email);
  if (channel === "sms") {
    return clean(
      preferences.phone_for_sms ||
        variables.phone_for_sms ||
        variables.phone ||
        user.phone_e164 ||
        user.phone ||
        [user.phone_code, user.phone_national].filter(Boolean).join(""),
    );
  }
  if (channel === "manual_whatsapp" || channel === "whatsapp_business") {
    return clean(
      variables.whatsapp_phone ||
        variables.phone ||
        user.phone_e164 ||
        user.phone ||
        [user.phone_code, user.phone_national].filter(Boolean).join(""),
    );
  }
  return clean(user._id);
};

export const writeCommunicationDeliveryLog = async ({
  userId,
  companyId = null,
  channel,
  eventKey = "",
  category = "system",
  templateKey = "",
  recipient = "",
  status = "queued",
  provider = "",
  providerMessageId = "",
  failureReason = "",
  payloadRedacted = {},
} = {}) =>
  CommunicationDeliveryLogModel.create({
    user_id: objectIdOrNull(userId),
    company_id: objectIdOrNull(companyId),
    channel,
    event_key: clean(eventKey),
    category: clean(category) || "system",
    template_key: clean(templateKey),
    recipient: clean(recipient),
    status,
    provider: clean(provider),
    provider_message_id: clean(providerMessageId),
    failure_reason: clean(failureReason),
    payload_redacted: payloadRedacted && typeof payloadRedacted === "object" ? payloadRedacted : {},
    sent_at: ["sent", "delivered", "read"].includes(status) ? new Date() : null,
  });

const sendViaChannel = async ({ channel, userId, user, category, eventKey, templateKey, variables, route, recipient }) => {
  if (channel === "in_app") {
    return sendInAppChannel({ userId, eventKey, category, templateKey, variables, route });
  }
  if (channel === "push") {
    return sendPushChannel({ userId, eventKey, category, templateKey, variables, route });
  }
  if (channel === "email") {
    return sendEmailChannel({ userId, user, templateKey, variables, lang: user?.lan || variables.lang || "en" });
  }
  if (channel === "sms") {
    return sendSmsChannel({ recipient, variables });
  }
  if (channel === "manual_whatsapp") {
    return sendManualWhatsappChannel({ recipient, variables });
  }

  return {
    status: "skipped",
    provider: "whatsapp_business",
    failureReason: "official_whatsapp_disabled",
  };
};

export const sendCommunicationEvent = async ({
  userId,
  companyId = null,
  eventKey = "communication_event",
  category,
  channels,
  templateKey = "",
  variables = {},
  route = {},
  respectPreferences = true,
} = {}) => {
  const normalizedUserId = objectIdOrNull(userId);
  if (!normalizedUserId) {
    const error = new Error("invalid_user_id");
    error.statusCode = 400;
    throw error;
  }

  const user = await UserModel.findById(normalizedUserId)
    .select("email phone phone_e164 phone_code phone_national lan")
    .lean();
  if (!user) {
    const error = new Error("user_not_found");
    error.statusCode = 404;
    throw error;
  }

  const resolvedCategory = category || categoryForNotificationEvent(eventKey);
  const requestedChannels = normalizeCommunicationChannels(channels);
  const results = [];

  for (const channel of requestedChannels.length ? requestedChannels : ["in_app"]) {
    const decision = await communicationChannelAllowed({
      userId: normalizedUserId,
      eventKey,
      category: resolvedCategory,
      channel,
      respectPreferences,
    });
    const recipient = recipientForChannel({ channel, user, preferences: decision.preferences, variables });

    if (!decision.allowed) {
      const log = await writeCommunicationDeliveryLog({
        userId: normalizedUserId,
        companyId,
        channel,
        eventKey,
        category: decision.category || resolvedCategory,
        templateKey,
        recipient,
        status: "skipped",
        provider: channel,
        failureReason: decision.reason || "preference_disabled",
        payloadRedacted: { respect_preferences: respectPreferences },
      });
      results.push({
        channel,
        status: "skipped",
        reason: decision.reason,
        log_id: String(log._id),
      });
      continue;
    }

    let channelResult;
    try {
      channelResult = await sendViaChannel({
        channel,
        userId: normalizedUserId,
        user,
        category: resolvedCategory,
        eventKey,
        templateKey,
        variables,
        route,
        recipient,
      });
    } catch (error) {
      channelResult = {
        status: "failed",
        provider: channel,
        recipient,
        failureReason: error?.message || "communication_channel_failed",
      };
    }

    const status = COMMUNICATION_DELIVERY_STATUSES.has(channelResult.status)
      ? channelResult.status
      : "failed";
    const log = await writeCommunicationDeliveryLog({
      userId: normalizedUserId,
      companyId,
      channel,
      eventKey,
      category: resolvedCategory,
      templateKey,
      recipient: channelResult.recipient || recipient,
      status,
      provider: channelResult.provider || channel,
      providerMessageId: channelResult.providerMessageId || "",
      failureReason: channelResult.failureReason || "",
      payloadRedacted: channelResult.payloadRedacted || {},
    });

    results.push({
      channel,
      status,
      reason: channelResult.failureReason || "",
      log_id: String(log._id),
      payload: channel === "manual_whatsapp" ? channelResult.payloadRedacted : undefined,
    });
  }

  return {
    event_key: eventKey,
    category: resolvedCategory,
    results,
    sent: results.filter((item) => item.status === "sent").length,
    queued: results.filter((item) => item.status === "queued").length,
    skipped: results.filter((item) => item.status === "skipped").length,
    failed: results.filter((item) => item.status === "failed").length,
  };
};

const COMMUNICATION_DELIVERY_STATUSES = new Set(["queued", "sent", "skipped", "failed", "delivered", "read"]);

export default {
  COMMUNICATION_CHANNELS,
  normalizeCommunicationChannels,
  sendCommunicationEvent,
  writeCommunicationDeliveryLog,
};
