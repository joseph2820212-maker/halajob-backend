export const normalizeText = (value = "") => {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g, "")
    .replace(/[\u0622\u0623\u0625]/g, "ا")
    .replace(/\u0649/g, "ي")
    .replace(/\u0640/g, "")
    .replace(/[^a-z0-9\u0600-\u06FF+#.]+/gi, " ")
    .trim()
    .replace(/\s+/g, " ");
};

export const uniqueCleanArray = (items = []) => {
  return [
    ...new Set(
      items
        .flat(Infinity)
        .map((x) => normalizeText(x))
        .filter(Boolean)
    ),
  ];
};

export const buildTokens = (...values) => {
  return uniqueCleanArray(
    values
      .flat(Infinity)
      .filter(Boolean)
      .flatMap((value) => normalizeText(value).split(" "))
  );
};

export const buildSearchText = (...values) => {
  return uniqueCleanArray(values.flat(Infinity).filter(Boolean)).join(" ");
};

export const pickLocalizedName = (value = {}) => {
  if (!value || typeof value !== "object") return "";
  return (
    value.name ||
    value.title_en ||
    value.title_ar ||
    value.name_en ||
    value.name_ar ||
    value.country_name_en ||
    value.country_name_ar ||
    value.city_name_en ||
    value.city_name_ar ||
    value.key ||
    value.code ||
    ""
  );
};
