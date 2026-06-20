const BLOCKED_KEYS = new Set(["__proto__", "prototype", "constructor", "_id", "id"]);

const isSafeKey = (key = "") => {
  const text = String(key || "").trim();
  return Boolean(text) && !text.startsWith("$") && !BLOCKED_KEYS.has(text);
};

const sanitizeValue = (value) => {
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (!value || typeof value !== "object" || value instanceof Date) return value;

  return Object.entries(value).reduce((acc, [key, nested]) => {
    if (!isSafeKey(key)) return acc;
    acc[key] = sanitizeValue(nested);
    return acc;
  }, {});
};

export const sanitizeDashUpdate = (body = {}) =>
  Object.entries(body || {}).reduce((acc, [key, value]) => {
    const parts = String(key).split(".").map((part) => part.trim()).filter(Boolean);
    if (!parts.length || parts.some((part) => !isSafeKey(part))) return acc;
    acc[key] = sanitizeValue(value);
    return acc;
  }, {});
