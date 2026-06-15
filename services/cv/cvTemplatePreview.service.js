const escapeXml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export const generateTemplatePreviewImage = async (template = {}) => {
  const title = escapeXml(template.title_en || template.key || "CV Template");
  const accent = template.default_colors?.accent_color || "#2563eb";
  const sidebar = template.default_colors?.sidebar_color || "#111827";
  const background = template.default_colors?.background_color || "#f8fafc";

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="640" height="900" viewBox="0 0 640 900">
  <rect width="640" height="900" fill="${escapeXml(background)}"/>
  <rect x="72" y="72" width="496" height="756" rx="18" fill="#fff"/>
  <rect x="72" y="72" width="148" height="756" rx="18" fill="${escapeXml(sidebar)}"/>
  <circle cx="146" cy="156" r="42" fill="${escapeXml(accent)}"/>
  <rect x="252" y="118" width="222" height="24" rx="12" fill="${escapeXml(sidebar)}"/>
  <rect x="252" y="164" width="160" height="16" rx="8" fill="${escapeXml(accent)}"/>
  <rect x="252" y="246" width="248" height="14" rx="7" fill="#d1d5db"/>
  <rect x="252" y="280" width="206" height="14" rx="7" fill="#e5e7eb"/>
  <rect x="252" y="338" width="248" height="14" rx="7" fill="#d1d5db"/>
  <rect x="252" y="372" width="188" height="14" rx="7" fill="#e5e7eb"/>
  <rect x="110" y="248" width="72" height="12" rx="6" fill="rgba(255,255,255,.72)"/>
  <rect x="110" y="286" width="64" height="12" rx="6" fill="rgba(255,255,255,.52)"/>
  <rect x="110" y="324" width="82" height="12" rx="6" fill="rgba(255,255,255,.52)"/>
  <text x="320" y="742" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="700" fill="${escapeXml(sidebar)}">${title}</text>
</svg>`.trim();

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
};
