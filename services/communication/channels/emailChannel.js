import { sendTemplatedEmail } from "../../email/templatedEmail.service.js";

export const sendEmailChannel = async ({
  userId,
  user = {},
  templateKey = "",
  variables = {},
  lang = "en",
} = {}) => {
  const to = String(user?.email || variables.email || "").trim();
  if (!to) {
    return {
      status: "skipped",
      provider: "smtp",
      failureReason: "email_recipient_missing",
    };
  }
  if (!templateKey) {
    return {
      status: "skipped",
      provider: "smtp",
      recipient: to,
      failureReason: "email_template_missing",
    };
  }

  const result = await sendTemplatedEmail({
    templateKey,
    to,
    lang,
    variables,
    userId,
    role: variables.role || "",
  });

  if (result.status === "sent") {
    return {
      status: "sent",
      provider: "smtp",
      recipient: to,
      providerMessageId: result.providerMessageId || "",
      payloadRedacted: { email_log_id: String(result.logId || "") },
    };
  }

  return {
    status: result.status === "failed" ? "failed" : "skipped",
    provider: "smtp",
    recipient: to,
    failureReason: result.error || result.reason || result.status || "email_not_sent",
    payloadRedacted: { email_log_id: String(result.logId || "") },
  };
};

export default sendEmailChannel;
