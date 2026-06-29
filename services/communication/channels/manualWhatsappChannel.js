import { buildManualWhatsappLink } from "../manualWhatsappLink.service.js";

export const sendManualWhatsappChannel = async ({ recipient = "", variables = {} } = {}) => {
  const link = buildManualWhatsappLink({
    phone: recipient || variables.phone || variables.phone_e164,
    text:
      variables.whatsapp_text ||
      variables.message ||
      variables.body ||
      variables.title ||
      "Hala Job update",
  });

  return {
    status: "queued",
    provider: "manual_whatsapp",
    recipient: link.phone,
    failureReason: "manual_action_required",
    payloadRedacted: {
      url: link.url,
      text_preview: link.text.slice(0, 160),
    },
  };
};

export default sendManualWhatsappChannel;
