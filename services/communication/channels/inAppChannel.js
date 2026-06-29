import { notifyUser } from "../../../notification/notificationService.js";

export const sendInAppChannel = async ({
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
    save: true,
    push: false,
  });

  if (result?.error) {
    return {
      status: "failed",
      provider: "notification",
      failureReason: result.error,
      payloadRedacted: { note: result.note || "", saved: result.saved || null },
    };
  }

  if (result?.saved) {
    return {
      status: "sent",
      provider: "notification",
      providerMessageId: String(result.saved),
      payloadRedacted: { saved: String(result.saved) },
    };
  }

  return {
    status: "skipped",
    provider: "notification",
    failureReason: result?.note || "in_app_not_saved",
    payloadRedacted: { note: result?.note || "" },
  };
};

export default sendInAppChannel;
