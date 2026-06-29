import { notifyUser } from "../../../notification/notificationService.js";

export const sendPushChannel = async ({
  userId,
  eventKey,
  category,
  route = {},
  templateKey = "",
  variables = {},
} = {}) => {
  const result = await notifyUser({
    userId,
    eventKey,
    audience: route.audience,
    routeKey: route.route_key || route.routeKey,
    routeParams: route.params || route.routeParams || {},
    title: variables.title,
    body: variables.body || variables.message,
    params: variables,
    data: {
      communication_category: category,
      template_key: templateKey,
      ...(route.data || {}),
    },
    save: false,
    push: true,
  });

  if (result?.error) {
    return {
      status: "failed",
      provider: "fcm",
      failureReason: result.error,
      payloadRedacted: { note: result.note || "" },
    };
  }

  const success = Number(result?.success || 0);
  if (success > 0) {
    return {
      status: "sent",
      provider: "fcm",
      payloadRedacted: {
        success,
        failure: Number(result?.failure || 0),
        revoked: Number(result?.revoked || 0),
      },
    };
  }

  return {
    status: "skipped",
    provider: "fcm",
    failureReason: result?.note || "no_push_delivery",
    payloadRedacted: {
      success,
      failure: Number(result?.failure || 0),
      revoked: Number(result?.revoked || 0),
      note: result?.note || "",
    },
  };
};

export default sendPushChannel;
