const clean = (value = "") => String(value || "").trim();

export const sendSmsChannel = async ({ recipient = "", variables = {} } = {}) => {
  const provider = clean(process.env.SMS_PROVIDER || "disabled").toLowerCase();
  const senderId = clean(process.env.SMS_SENDER_ID || "HalaJob");
  const target = clean(recipient || variables.phone_for_sms || variables.phone || variables.phone_e164);

  if (!target) {
    return {
      status: "skipped",
      provider,
      failureReason: "sms_recipient_missing",
    };
  }

  if (!provider || provider === "disabled" || provider === "none") {
    return {
      status: "skipped",
      provider: provider || "disabled",
      recipient: target,
      failureReason: "provider_disabled",
    };
  }

  if (provider === "console" || provider === "log") {
    return {
      status: "sent",
      provider,
      recipient: target,
      providerMessageId: `local-${Date.now()}`,
      payloadRedacted: { sender_id: senderId, mode: "local_log" },
    };
  }

  return {
    status: "failed",
    provider,
    recipient: target,
    failureReason: "provider_not_configured",
  };
};

export default sendSmsChannel;
