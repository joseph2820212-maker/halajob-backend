const MAX_TEXT_LENGTH = 1200;

const clean = (value = "") => String(value || "").trim();

export const normalizeWhatsappPhone = (value = "") => {
  const raw = clean(value).replace(/[^\d+]/g, "");
  if (!raw) return "";
  const hasLeadingPlus = raw.startsWith("+");
  const digits = raw.replace(/\D/g, "");
  if (!digits || digits.length < 5 || digits.length > 18) return "";
  return `${hasLeadingPlus ? "+" : ""}${digits}`;
};

export const buildManualWhatsappLink = ({ phone = "", text = "" } = {}) => {
  const safePhone = normalizeWhatsappPhone(phone);
  const safeText = clean(text).replace(/\s+/g, " ").slice(0, MAX_TEXT_LENGTH);
  if (!safeText) {
    const error = new Error("manual_whatsapp_text_required");
    error.statusCode = 400;
    throw error;
  }

  const phonePath = safePhone ? safePhone.replace(/^\+/, "") : "";
  const encodedText = encodeURIComponent(safeText);
  const url = `https://wa.me/${phonePath}${encodedText ? `?text=${encodedText}` : ""}`;

  return {
    channel: "manual_whatsapp",
    phone: safePhone,
    text: safeText,
    copy_text: safeText,
    url,
  };
};

export default {
  buildManualWhatsappLink,
  normalizeWhatsappPhone,
};
