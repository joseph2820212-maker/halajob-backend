import { CvTemplateModel } from "../models/index.js";
import { generateTemplatePreviewImage } from "../services/cv/cvTemplatePreview.service.js";

const baseHead = `
<!doctype html>
<html lang="<%= lang %>" dir="<%= dir %>">
<head>
  <meta charset="UTF-8" />
  <style>
    <%- css %>
  </style>
</head>
`;

const safeImageBlock = `
<% const safePhotoUrl =
  (typeof profile_image_url !== "undefined" && profile_image_url)
    ? profile_image_url
    : ((typeof image !== "undefined" && image) ? image : ""); %>
`;

const contactBlock = `
<% if (sections.contact !== false && (email || phone || location)) { %>
  <div class="contact">
    <% if (email) { %><span>✉ <%= email %></span><% } %>
    <% if (phone) { %><span>☎ <%= phone %></span><% } %>
    <% if (location) { %><span>⌖ <%= location %></span><% } %>
  </div>
<% } %>
`;

const mainBlocks = `
<% if (sections.profile !== false && summary) { %>
  <section><h3>Profile</h3><p><%= summary %></p></section>
<% } %>

<% if (sections.experience !== false && experience.length) { %>
  <section>
    <h3>Experience</h3>
    <% experience.forEach(function(item) { %>
      <div class="item">
        <div class="row">
          <h4><%= item.position || "" %></h4>
          <% if (item.start_date || item.end_date) { %><span><%= item.start_date || "" %> - <%= item.end_date || "" %></span><% } %>
        </div>
        <% if (item.company_name) { %><p class="meta"><%= item.company_name %></p><% } %>
        <% if (item.details) { %><p><%= item.details %></p><% } %>
      </div>
    <% }) %>
  </section>
<% } %>

<% if (sections.education !== false && education.length) { %>
  <section>
    <h3>Education</h3>
    <% education.forEach(function(item) { %>
      <div class="item">
        <div class="row">
          <h4><%= item.study || item.level || "" %></h4>
          <% if (item.start_date || item.end_date) { %><span><%= item.start_date || "" %> - <%= item.end_date || "" %></span><% } %>
        </div>
        <% if (item.institution) { %><p class="meta"><%= item.institution %><% if (item.level) { %> — <%= item.level %><% } %></p><% } %>
      </div>
    <% }) %>
  </section>
<% } %>
`;

const sideBlocks = `
<% if (sections.skills !== false && skills.length) { %>
  <section>
    <h3>Skills</h3>
    <div class="tags">
      <% skills.forEach(function(skill) { %>
        <span><%= skill.title || "" %><% if (skill.percent) { %> • <%= skill.percent %>%<% } %></span>
      <% }) %>
    </div>
  </section>
<% } %>

<% if (sections.languages !== false && languages.length) { %>
  <section>
    <h3>Languages</h3>
    <% languages.forEach(function(language) { %>
      <p class="lang"><strong><%= language.title || "" %></strong><span><%= language.level_text || "" %></span></p>
    <% }) %>
  </section>
<% } %>

<% if (sections.links !== false && links.length) { %>
  <section>
    <h3>Links</h3>
    <% links.forEach(function(link) { %>
      <p class="link"><strong><%= link.title || "" %>:</strong> <%= link.url || "" %></p>
    <% }) %>
  </section>
<% } %>

<% if (sections.job_preferences !== false && typeof job_preferences !== "undefined" && job_preferences) { %>
  <section class="preference-box"><h3>Preferences</h3><p><%= job_preferences %></p></section>
<% } %>
`;

const templateHtml = (layout = "minimal") => {
  const headerName = `<h1 style="color:<%= sidebar_color %>;"><%= full_name %></h1><% if (job_title) { %><h2 style="color:<%= accent_color %>;"><%= job_title %></h2><% } %>`;

  const layouts = {
    sidebar: `${baseHead}<body style="background:<%= background_color %>; font-family:'<%= font_family %>', Arial, sans-serif;">${safeImageBlock}<div class="cv cv-sidebar"><aside class="side" style="background:<%= sidebar_color %>;"><% if (safePhotoUrl) { %><img class="photo" src="<%= safePhotoUrl %>" alt="<%= full_name %>" /><% } else { %><div class="avatar" style="background:<%= accent_color %>;"><%= initials %></div><% } %><h1><%= full_name %></h1><% if (job_title) { %><h2 style="color:<%= accent_color %>;"><%= job_title %></h2><% } %>${contactBlock}${sideBlocks}</aside><main class="main">${mainBlocks}</main></div></body></html>`,
    split: `${baseHead}<body style="background:<%= background_color %>; font-family:'<%= font_family %>', Arial, sans-serif;">${safeImageBlock}<div class="cv cv-split"><section class="split-head" style="background:<%= sidebar_color %>;"><div class="avatar" style="background:<%= accent_color %>;"><%= initials %></div><h1><%= full_name %></h1><% if (job_title) { %><h2 style="color:<%= accent_color %>;"><%= job_title %></h2><% } %>${contactBlock}</section><main class="split-body">${mainBlocks}${sideBlocks}</main></div></body></html>`,
    banner: `${baseHead}<body style="background:<%= background_color %>; font-family:'<%= font_family %>', Arial, sans-serif;">${safeImageBlock}<div class="cv cv-banner"><header class="banner" style="border-color:<%= accent_color %>;">
      <div>${headerName}</div><% if (safePhotoUrl) { %><img class="photo" src="<%= safePhotoUrl %>" alt="<%= full_name %>" /><% } %></header>${contactBlock}<main class="main">${mainBlocks}${sideBlocks}</main></div></body></html>`,
    creative: `${baseHead}<body style="background:<%= background_color %>; font-family:'<%= font_family %>', Arial, sans-serif;">${safeImageBlock}<div class="cv cv-creative"><header class="creative-hero"><div><p class="eyebrow" style="color:<%= accent_color %>;">Curriculum Vitae</p>${headerName}</div><div class="orb" style="border-color:<%= accent_color %>;"></div></header>${contactBlock}<main class="creative-grid"><div>${mainBlocks}</div><aside>${sideBlocks}</aside></main></div></body></html>`,
    grid: `${baseHead}<body style="background:<%= background_color %>; font-family:'<%= font_family %>', Arial, sans-serif;">${safeImageBlock}<div class="cv cv-grid"><header class="grid-head">${headerName}${contactBlock}</header><main class="two-grid"><div>${mainBlocks}</div><aside>${sideBlocks}</aside></main></div></body></html>`,
    timeline: `${baseHead}<body style="background:<%= background_color %>; font-family:'<%= font_family %>', Arial, sans-serif;">${safeImageBlock}<div class="cv cv-timeline"><header class="line-head">${headerName}${contactBlock}</header><main class="timeline-layout">${mainBlocks}${sideBlocks}</main></div></body></html>`,
    cards: `${baseHead}<body style="background:<%= background_color %>; font-family:'<%= font_family %>', Arial, sans-serif;">${safeImageBlock}<div class="cv cv-cards"><header class="card-head" style="background:<%= sidebar_color %>;"><h1><%= full_name %></h1><% if (job_title) { %><h2 style="color:<%= accent_color %>;"><%= job_title %></h2><% } %>${contactBlock}</header><main class="card-layout">${mainBlocks}${sideBlocks}</main></div></body></html>`,
    editorial: `${baseHead}<body style="background:<%= background_color %>; font-family:'<%= font_family %>', Arial, sans-serif;">${safeImageBlock}<div class="cv cv-editorial"><header class="editorial-head"><p style="color:<%= accent_color %>;">Professional Profile</p>${headerName}${contactBlock}</header><main class="editorial-body">${mainBlocks}${sideBlocks}</main></div></body></html>`,
    compact: `${baseHead}<body style="background:<%= background_color %>; font-family:'<%= font_family %>', Arial, sans-serif;">${safeImageBlock}<div class="cv cv-compact"><header class="minimal-head">${headerName}${contactBlock}</header><main class="main">${mainBlocks}${sideBlocks}</main></div></body></html>`,
    minimal: `${baseHead}<body style="background:<%= background_color %>; font-family:'<%= font_family %>', Arial, sans-serif;">${safeImageBlock}<div class="cv cv-minimal"><header class="minimal-head">${headerName}${contactBlock}</header><main class="main">${mainBlocks}${sideBlocks}</main></div></body></html>`,
  };

  return layouts[layout] || layouts.minimal;
};

const baseCss = `
@page { size: A4; margin: 0; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; min-height: 297mm; }
body { color: <%= text_color %>; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.cv { width: 210mm; min-height: 297mm; background: <%= card_color %>; color: <%= text_color %>; overflow: hidden; }
h1, h2, h3, h4, p { margin-top: 0; }
h1 { font-size: 34px; line-height: 1.08; letter-spacing: -0.7px; margin-bottom: 3mm; }
h2 { font-size: 16px; line-height: 1.35; margin-bottom: 5mm; font-weight: 700; }
h3 { color: <%= sidebar_color %>; border-color: <%= accent_color %>; }
section { margin-bottom: 7mm; page-break-inside: avoid; }
section h3 { margin-bottom: 3.5mm; padding-bottom: 1.7mm; border-bottom: 1.5px solid; font-size: 14px; text-transform: uppercase; letter-spacing: .7px; }
section p { font-size: 12.4px; line-height: 1.65; margin-bottom: 1.6mm; }
.item { margin-bottom: 4.6mm; page-break-inside: avoid; }
.row { display: flex; justify-content: space-between; gap: 6mm; align-items: baseline; }
.row h4 { color: #111827; margin: 0 0 1mm; font-size: 13.6px; line-height: 1.35; }
.row span { color: <%= accent_color %>; font-size: 11px; font-weight: 700; white-space: nowrap; }
.meta { color: <%= accent_color %>; font-weight: 700; }
.contact { display: flex; flex-wrap: wrap; gap: 2mm 5mm; font-size: 11.5px; line-height: 1.5; }
.tags { display: flex; flex-wrap: wrap; gap: 2.2mm; }
.tags span { border: 1px solid <%= accent_color %>; color: <%= text_color %>; border-radius: 999px; padding: 1.6mm 3.2mm; font-size: 11.2px; line-height: 1.25; }
.lang { display: flex; justify-content: space-between; gap: 4mm; border-bottom: 1px solid rgba(100,116,139,.22); padding-bottom: 1.5mm; }
.link { word-break: break-word; }
.avatar { width: 28mm; height: 28mm; border-radius: 999px; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 25px; font-weight: 800; margin-bottom: 6mm; }
.photo { width: 28mm; height: 28mm; object-fit: cover; border-radius: 999px; display: block; margin-bottom: 6mm; }
.preference-box { border: 1px solid <%= accent_color %>; border-radius: 4mm; padding: 4mm; }
html[dir="rtl"] .row { flex-direction: row-reverse; }
html[dir="rtl"] .contact { direction: rtl; }
`;

const layoutCss = {
  minimal: `.cv-minimal { padding: 17mm 18mm; } .minimal-head { text-align:center; padding-bottom:7mm; margin-bottom:8mm; border-bottom:1px solid #e5e7eb; } .minimal-head .contact { justify-content:center; }`,
  compact: `.cv-compact { padding: 12mm 14mm; } .cv-compact h1{font-size:28px}.cv-compact section{margin-bottom:4.5mm}.cv-compact section p{font-size:11.5px;line-height:1.48}.cv-compact .item{margin-bottom:3mm}.minimal-head{border-bottom:1px solid #e5e7eb;margin-bottom:5mm;padding-bottom:5mm}`,
  sidebar: `.cv-sidebar{display:grid;grid-template-columns:70mm 1fr}.side{min-height:297mm;padding:12mm 8mm;color:#fff}.side h1{font-size:25px;color:#fff}.side h3{color:#fff!important;border-color:rgba(255,255,255,.35)!important}.side .row{display:block}.side .row span{white-space:normal}.side .tags span{color:#fff;background:rgba(255,255,255,.08)}.main{padding:13mm 12mm}.side .meta,.side .row span{color:rgba(255,255,255,.82)!important}`,
  split: `.cv-split{display:grid;grid-template-columns:74mm 1fr}.split-head{min-height:297mm;color:#fff;padding:13mm 9mm}.split-head h1{color:#fff;font-size:27px}.split-head .contact{display:block}.split-head .contact span{display:block;margin-bottom:2.4mm}.split-body{padding:14mm 12mm}.split-body section h3{border-left:4px solid;padding-left:3mm;border-bottom:0}html[dir="rtl"] .split-body section h3{border-left:0;border-right:4px solid;padding-left:0;padding-right:3mm}`,
  banner: `.cv-banner{padding:10mm}.banner{display:flex;justify-content:space-between;align-items:flex-start;gap:8mm;border-bottom:3px solid;padding:8mm 4mm 7mm;margin-bottom:5mm}.cv-banner>.contact{background:#f8fafc;padding:4mm 5mm;margin-bottom:7mm}.main{padding:0 4mm}.banner .photo{border-radius:7mm;width:31mm;height:31mm}`,
  creative: `.cv-creative{padding:11mm;background:linear-gradient(135deg,<%= card_color %>,<%= background_color %>)}.creative-hero{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:7mm}.eyebrow{text-transform:uppercase;letter-spacing:1.7px;font-size:10.5px;font-weight:800;margin-bottom:2mm}.orb{width:44mm;height:44mm;border:2px solid;border-radius:999px;opacity:.5}.creative-grid{display:grid;grid-template-columns:2fr 1fr;gap:9mm}.cv-creative section{background:rgba(255,255,255,.55);border:1px solid rgba(100,116,139,.18);border-radius:4mm;padding:5mm}.cv-creative section h3{border-bottom:0;margin-bottom:3mm}`,
  grid: `.cv-grid{padding:14mm}.grid-head{padding-bottom:7mm;margin-bottom:7mm;border-bottom:1.7mm solid <%= accent_color %>}.two-grid{display:grid;grid-template-columns:1.65fr .9fr;gap:8mm}.two-grid aside section{background:#f8fafc;border-radius:3mm;padding:4mm}.two-grid aside section h3{border-bottom:0}`,
  timeline: `.cv-timeline{padding:16mm}.line-head{margin-bottom:8mm;padding-bottom:6mm;border-bottom:1px solid #e5e7eb}.timeline-layout .item{border-left:2px solid <%= accent_color %>;padding-left:5mm}.timeline-layout section h3{border-bottom:0;font-size:16px}html[dir="rtl"] .timeline-layout .item{border-left:0;border-right:2px solid <%= accent_color %>;padding-left:0;padding-right:5mm}`,
  cards: `.cv-cards{padding:0}.card-head{color:#fff;padding:14mm 15mm 10mm}.card-head h1{color:#fff}.card-head .contact{color:rgba(255,255,255,.9)}.card-layout{padding:11mm 14mm;display:grid;grid-template-columns:1.45fr 1fr;gap:7mm}.card-layout section{background:#fff;border:1px solid #e5e7eb;border-radius:4mm;padding:5mm;box-shadow:0 6px 18px rgba(15,23,42,.06)}.card-layout section h3{border-bottom:0}`,
  editorial: `.cv-editorial{padding:17mm 18mm}.editorial-head{text-align:left;border-bottom:3px double #d1d5db;padding-bottom:7mm;margin-bottom:8mm}.editorial-head>p{text-transform:uppercase;letter-spacing:2px;font-size:10.5px;font-weight:800}.editorial-head h2{color:#4b5563;font-family:Georgia,serif;font-style:italic}.editorial-body section h3{text-transform:none;font-size:16px;letter-spacing:0;border-bottom:1px solid #d1d5db}`
};

const makeCss = (layout) => baseCss + "" + (layoutCss[layout] || layoutCss.minimal);

const templates = [
  {
    key: "modern-sidebar",
    title_ar: "قالب عصري جانبي",
    title_en: "Modern Sidebar",
    description_ar: "قالب عصري مع شريط جانبي قوي للمهارات والتواصل",
    description_en: "Modern CV with a strong sidebar for skills and contact",
    html: templateHtml("sidebar"),
    css: makeCss("sidebar"),
    sort_order: 1,
    default_colors: {
      background_color: "#f8fafc",
      sidebar_color: "#0f172a",
      accent_color: "#2563eb",
      text_color: "#334155",
      card_color: "#ffffff",
    },
    default_font: { font_family: "Arial", font_size: 14 },
  },
  {
    key: "modern-banner",
    title_ar: "قالب عصري علوي",
    title_en: "Modern Banner",
    description_ar: "قالب بترويسة علوية عصرية وشريط تواصل واضح",
    description_en: "Modern top banner CV with a clear contact bar",
    html: templateHtml("banner"),
    css: makeCss("banner"),
    sort_order: 2,
    default_colors: {
      background_color: "#f8fafc",
      sidebar_color: "#111827",
      accent_color: "#7c3aed",
      text_color: "#374151",
      card_color: "#ffffff",
    },
    default_font: { font_family: "Arial", font_size: 14 },
  },
  {
    key: "clean-minimal",
    title_ar: "قالب بسيط ونظيف",
    title_en: "Clean Minimal",
    description_ar: "قالب بسيط مناسب للوظائف الرسمية والأكاديمية",
    description_en: "Clean minimal CV for formal and academic roles",
    html: templateHtml("minimal"),
    css: makeCss("minimal"),
    sort_order: 3,
    default_colors: {
      background_color: "#ffffff",
      sidebar_color: "#111827",
      accent_color: "#0f766e",
      text_color: "#374151",
      card_color: "#ffffff",
    },
    default_font: { font_family: "Arial", font_size: 14 },
  },
  {
    key: "split-classic",
    title_ar: "قالب كلاسيكي مقسوم",
    title_en: "Split Classic",
    description_ar: "قالب مقسوم احترافي مع جانب داكن",
    description_en: "Professional split CV with dark side panel",
    html: templateHtml("split"),
    css: makeCss("split"),
    sort_order: 4,
    default_colors: {
      background_color: "#ffffff",
      sidebar_color: "#1f2937",
      accent_color: "#d97706",
      text_color: "#374151",
      card_color: "#ffffff",
    },
    default_font: { font_family: "Georgia", font_size: 14 },
  },
  {
    key: "creative-dark",
    title_ar: "قالب إبداعي داكن",
    title_en: "Creative Dark",
    description_ar: "قالب داكن للمصممين والمبدعين",
    description_en: "Dark creative CV for designers and creative roles",
    html: templateHtml("creative"),
    css: makeCss("creative"),
    sort_order: 5,
    default_colors: {
      background_color: "#111827",
      sidebar_color: "#f9fafb",
      accent_color: "#38bdf8",
      text_color: "#d1d5db",
      card_color: "#1f2937",
    },
    default_font: { font_family: "Arial", font_size: 14 },
  },
  {
    key: "ats-classic",
    title_ar: "ATS كلاسيكي",
    title_en: "ATS Classic",
    description_ar: "قالب واضح متوافق مع أنظمة ATS",
    description_en: "Clear ATS-compatible template",
    html: templateHtml("minimal"),
    css: makeCss("minimal"),
    sort_order: 6,
    default_colors: {
      background_color: "#ffffff",
      sidebar_color: "#111827",
      accent_color: "#2563eb",
      text_color: "#374151",
      card_color: "#ffffff",
    },
    default_font: { font_family: "Arial", font_size: 14 },
  },
  {
    key: "ats-compact",
    title_ar: "ATS مضغوط",
    title_en: "ATS Compact",
    description_ar: "قالب مختصر للمحتوى الطويل مع قراءة عالية",
    description_en: "Compact ATS template for long content",
    html: templateHtml("compact"),
    css: makeCss("compact"),
    sort_order: 7,
    default_colors: {
      background_color: "#ffffff",
      sidebar_color: "#111827",
      accent_color: "#0f766e",
      text_color: "#374151",
      card_color: "#ffffff",
    },
    default_font: { font_family: "Arial", font_size: 14 },
  },
  {
    key: "ats-executive",
    title_ar: "ATS تنفيذي",
    title_en: "ATS Executive",
    description_ar: "قالب رسمي للمدراء والخبرات القيادية",
    description_en: "Formal ATS template for executives",
    html: templateHtml("editorial"),
    css: makeCss("editorial"),
    sort_order: 8,
    default_colors: {
      background_color: "#ffffff",
      sidebar_color: "#111827",
      accent_color: "#991b1b",
      text_color: "#374151",
      card_color: "#ffffff",
    },
    default_font: { font_family: "Georgia", font_size: 14 },
  },
  {
    key: "ats-academic",
    title_ar: "ATS أكاديمي",
    title_en: "ATS Academic",
    description_ar: "قالب أكاديمي منظم للتعليم والشهادات",
    description_en: "Academic ATS template for education-focused CVs",
    html: templateHtml("timeline"),
    css: makeCss("timeline"),
    sort_order: 9,
    default_colors: {
      background_color: "#ffffff",
      sidebar_color: "#1f2937",
      accent_color: "#4f46e5",
      text_color: "#374151",
      card_color: "#ffffff",
    },
    default_font: { font_family: "Times New Roman", font_size: 14 },
  },
  {
    key: "ats-technical",
    title_ar: "ATS تقني",
    title_en: "ATS Technical",
    description_ar: "قالب مناسب للمطورين والمهندسين",
    description_en: "ATS-friendly template for developers and engineers",
    html: templateHtml("grid"),
    css: makeCss("grid"),
    sort_order: 10,
    default_colors: {
      background_color: "#ffffff",
      sidebar_color: "#0f172a",
      accent_color: "#0284c7",
      text_color: "#334155",
      card_color: "#ffffff",
    },
    default_font: { font_family: "Arial", font_size: 14 },
  },
  {
    key: "ats-modern-line",
    title_ar: "ATS خط عصري",
    title_en: "ATS Modern Line",
    description_ar: "قالب عصري بخطوط فاصلة واضحة",
    description_en: "Modern line-based ATS template",
    html: templateHtml("timeline"),
    css: makeCss("timeline"),
    sort_order: 11,
    default_colors: {
      background_color: "#ffffff",
      sidebar_color: "#111827",
      accent_color: "#7c3aed",
      text_color: "#374151",
      card_color: "#ffffff",
    },
    default_font: { font_family: "Arial", font_size: 14 },
  },
  {
    key: "ats-two-column-lite",
    title_ar: "ATS عمودين خفيف",
    title_en: "ATS Two Column Lite",
    description_ar: "قالب عمودين خفيف وواضح للقراءة الآلية",
    description_en: "Light two-column ATS-oriented template",
    html: templateHtml("grid"),
    css: makeCss("grid"),
    sort_order: 12,
    default_colors: {
      background_color: "#ffffff",
      sidebar_color: "#111827",
      accent_color: "#ca8a04",
      text_color: "#374151",
      card_color: "#ffffff",
    },
    default_font: { font_family: "Arial", font_size: 14 },
  },
  {
    key: "ats-photo-header",
    title_ar: "ATS بصورة علوية",
    title_en: "ATS Photo Header",
    description_ar: "قالب ATS مع صورة اختيارية في الأعلى",
    description_en: "ATS template with optional header photo",
    html: templateHtml("banner"),
    css: makeCss("banner"),
    sort_order: 13,
    default_colors: {
      background_color: "#ffffff",
      sidebar_color: "#111827",
      accent_color: "#2563eb",
      text_color: "#374151",
      card_color: "#ffffff",
    },
    default_font: { font_family: "Arial", font_size: 14 },
  },
  {
    key: "ats-photo-sidebar",
    title_ar: "ATS بصورة جانبية",
    title_en: "ATS Photo Sidebar",
    description_ar: "قالب احترافي مع صورة اختيارية وشريط جانبي",
    description_en: "Professional CV with optional photo sidebar",
    html: templateHtml("sidebar"),
    css: makeCss("sidebar"),
    sort_order: 14,
    default_colors: {
      background_color: "#ffffff",
      sidebar_color: "#111827",
      accent_color: "#0f766e",
      text_color: "#374151",
      card_color: "#ffffff",
    },
    default_font: { font_family: "Arial", font_size: 14 },
  },
  {
    key: "ats-blueprint",
    title_ar: "ATS أزرق رسمي",
    title_en: "ATS Blueprint",
    description_ar: "قالب رسمي بلون أزرق هادئ",
    description_en: "Professional blue ATS-compatible template",
    html: templateHtml("minimal"),
    css: makeCss("minimal"),
    sort_order: 15,
    default_colors: {
      background_color: "#eff6ff",
      sidebar_color: "#1e3a8a",
      accent_color: "#2563eb",
      text_color: "#334155",
      card_color: "#ffffff",
    },
    default_font: { font_family: "Arial", font_size: 14 },
  },
  {
    key: "software-engineer-pro",
    title_ar: "مهندس برمجيات احترافي",
    title_en: "Software Engineer Pro",
    description_ar: "قالب تقني للمطورين مع إبراز المهارات التقنية",
    description_en: "Technical resume focused on engineering skills",
    html: templateHtml("grid"),
    css: makeCss("grid"),
    sort_order: 16,
    default_colors: {
      background_color: "#f8fafc",
      sidebar_color: "#0f172a",
      accent_color: "#06b6d4",
      text_color: "#334155",
      card_color: "#ffffff",
    },
    default_font: { font_family: "Arial", font_size: 14 },
  },
  {
    key: "product-manager-modern",
    title_ar: "مدير منتج عصري",
    title_en: "Product Manager Modern",
    description_ar: "قالب لإدارة المنتجات والقيادة والتأثير",
    description_en: "Product management resume focused on impact",
    html: templateHtml("banner"),
    css: makeCss("banner"),
    sort_order: 17,
    default_colors: {
      background_color: "#fff7ed",
      sidebar_color: "#1f2937",
      accent_color: "#ea580c",
      text_color: "#374151",
      card_color: "#ffffff",
    },
    default_font: { font_family: "Arial", font_size: 14 },
  },
  {
    key: "ux-ui-designer",
    title_ar: "مصمم UX/UI",
    title_en: "UX/UI Designer",
    description_ar: "قالب بصري نظيف للمصممين وتجربة المستخدم",
    description_en: "Visual clean template for UX and UI designers",
    html: templateHtml("creative"),
    css: makeCss("creative"),
    sort_order: 18,
    default_colors: {
      background_color: "#faf5ff",
      sidebar_color: "#581c87",
      accent_color: "#a855f7",
      text_color: "#4b5563",
      card_color: "#ffffff",
    },
    default_font: { font_family: "Arial", font_size: 14 },
  },
  {
    key: "marketing-growth",
    title_ar: "تسويق ونمو",
    title_en: "Marketing Growth",
    description_ar: "قالب للتسويق الرقمي والنمو والحملات",
    description_en: "Marketing and growth-focused CV",
    html: templateHtml("cards"),
    css: makeCss("cards"),
    sort_order: 19,
    default_colors: {
      background_color: "#fef2f2",
      sidebar_color: "#7f1d1d",
      accent_color: "#ef4444",
      text_color: "#374151",
      card_color: "#ffffff",
    },
    default_font: { font_family: "Arial", font_size: 14 },
  },
  {
    key: "sales-executive",
    title_ar: "مبيعات تنفيذي",
    title_en: "Sales Executive",
    description_ar: "قالب قوي للمبيعات والعلاقات والأرقام",
    description_en: "Sales CV focused on numbers and relationships",
    html: templateHtml("split"),
    css: makeCss("split"),
    sort_order: 20,
    default_colors: {
      background_color: "#f8fafc",
      sidebar_color: "#1e293b",
      accent_color: "#f59e0b",
      text_color: "#334155",
      card_color: "#ffffff",
    },
    default_font: { font_family: "Arial", font_size: 14 },
  },
  {
    key: "finance-analyst",
    title_ar: "محلل مالي",
    title_en: "Finance Analyst",
    description_ar: "قالب احترافي للأعمال المالية والمحاسبة",
    description_en: "Professional finance and accounting template",
    html: templateHtml("editorial"),
    css: makeCss("editorial"),
    sort_order: 21,
    default_colors: {
      background_color: "#f8fafc",
      sidebar_color: "#064e3b",
      accent_color: "#10b981",
      text_color: "#374151",
      card_color: "#ffffff",
    },
    default_font: { font_family: "Georgia", font_size: 14 },
  },
  {
    key: "accountant-clean",
    title_ar: "محاسب منظم",
    title_en: "Accountant Clean",
    description_ar: "قالب منظم للمحاسبين والتدقيق",
    description_en: "Organized template for accounting and audit",
    html: templateHtml("minimal"),
    css: makeCss("minimal"),
    sort_order: 22,
    default_colors: {
      background_color: "#ffffff",
      sidebar_color: "#1f2937",
      accent_color: "#059669",
      text_color: "#374151",
      card_color: "#ffffff",
    },
    default_font: { font_family: "Arial", font_size: 14 },
  },
  {
    key: "hr-recruiter",
    title_ar: "موارد بشرية وتوظيف",
    title_en: "HR Recruiter",
    description_ar: "قالب للموارد البشرية والتوظيف وإدارة المواهب",
    description_en: "Template for HR and talent acquisition",
    html: templateHtml("timeline"),
    css: makeCss("timeline"),
    sort_order: 23,
    default_colors: {
      background_color: "#fdf2f8",
      sidebar_color: "#831843",
      accent_color: "#db2777",
      text_color: "#374151",
      card_color: "#ffffff",
    },
    default_font: { font_family: "Arial", font_size: 14 },
  },
  {
    key: "operations-manager",
    title_ar: "مدير عمليات",
    title_en: "Operations Manager",
    description_ar: "قالب إداري للعمليات والتحسين والتنسيق",
    description_en: "Operations management template",
    html: templateHtml("split"),
    css: makeCss("split"),
    sort_order: 24,
    default_colors: {
      background_color: "#f8fafc",
      sidebar_color: "#111827",
      accent_color: "#64748b",
      text_color: "#334155",
      card_color: "#ffffff",
    },
    default_font: { font_family: "Arial", font_size: 14 },
  },
  {
    key: "project-manager",
    title_ar: "مدير مشاريع",
    title_en: "Project Manager",
    description_ar: "قالب لإدارة المشاريع والنتائج والمراحل",
    description_en: "Project management resume template",
    html: templateHtml("cards"),
    css: makeCss("cards"),
    sort_order: 25,
    default_colors: {
      background_color: "#f0f9ff",
      sidebar_color: "#0c4a6e",
      accent_color: "#0284c7",
      text_color: "#334155",
      card_color: "#ffffff",
    },
    default_font: { font_family: "Arial", font_size: 14 },
  },
  {
    key: "civil-engineer",
    title_ar: "مهندس مدني",
    title_en: "Civil Engineer",
    description_ar: "قالب هندسي للمواقع والمشاريع والبنية التحتية",
    description_en: "Engineering template for civil projects",
    html: templateHtml("sidebar"),
    css: makeCss("sidebar"),
    sort_order: 26,
    default_colors: {
      background_color: "#f5f5f4",
      sidebar_color: "#292524",
      accent_color: "#b45309",
      text_color: "#44403c",
      card_color: "#ffffff",
    },
    default_font: { font_family: "Arial", font_size: 14 },
  },
  {
    key: "architect-portfolio",
    title_ar: "مهندس معماري",
    title_en: "Architect Portfolio",
    description_ar: "قالب أنيق للمعماريين والتصميم المعماري",
    description_en: "Elegant template for architecture roles",
    html: templateHtml("editorial"),
    css: makeCss("editorial"),
    sort_order: 27,
    default_colors: {
      background_color: "#fafaf9",
      sidebar_color: "#1c1917",
      accent_color: "#a16207",
      text_color: "#44403c",
      card_color: "#ffffff",
    },
    default_font: { font_family: "Georgia", font_size: 14 },
  },
  {
    key: "mechanical-engineer",
    title_ar: "مهندس ميكانيك",
    title_en: "Mechanical Engineer",
    description_ar: "قالب تقني للصناعة والتصميم الميكانيكي",
    description_en: "Technical template for mechanical engineers",
    html: templateHtml("grid"),
    css: makeCss("grid"),
    sort_order: 28,
    default_colors: {
      background_color: "#f8fafc",
      sidebar_color: "#0f172a",
      accent_color: "#475569",
      text_color: "#334155",
      card_color: "#ffffff",
    },
    default_font: { font_family: "Arial", font_size: 14 },
  },
  {
    key: "electrical-engineer",
    title_ar: "مهندس كهرباء",
    title_en: "Electrical Engineer",
    description_ar: "قالب هندسي للطاقة والأنظمة الكهربائية",
    description_en: "Engineering template for electrical systems",
    html: templateHtml("timeline"),
    css: makeCss("timeline"),
    sort_order: 29,
    default_colors: {
      background_color: "#fffbeb",
      sidebar_color: "#713f12",
      accent_color: "#f59e0b",
      text_color: "#374151",
      card_color: "#ffffff",
    },
    default_font: { font_family: "Arial", font_size: 14 },
  },
  {
    key: "doctor-medical",
    title_ar: "طبيب / طبي",
    title_en: "Doctor Medical",
    description_ar: "قالب مهني للأطباء والقطاع الصحي",
    description_en: "Professional template for physicians and healthcare",
    html: templateHtml("minimal"),
    css: makeCss("minimal"),
    sort_order: 30,
    default_colors: {
      background_color: "#ecfeff",
      sidebar_color: "#164e63",
      accent_color: "#0891b2",
      text_color: "#334155",
      card_color: "#ffffff",
    },
    default_font: { font_family: "Arial", font_size: 14 },
  },
  {
    key: "nurse-healthcare",
    title_ar: "تمريض ورعاية صحية",
    title_en: "Nurse Healthcare",
    description_ar: "قالب واضح للتمريض والرعاية والخبرة السريرية",
    description_en: "Clear healthcare template for nursing roles",
    html: templateHtml("sidebar"),
    css: makeCss("sidebar"),
    sort_order: 31,
    default_colors: {
      background_color: "#f0fdf4",
      sidebar_color: "#14532d",
      accent_color: "#22c55e",
      text_color: "#334155",
      card_color: "#ffffff",
    },
    default_font: { font_family: "Arial", font_size: 14 },
  },
  {
    key: "pharmacist",
    title_ar: "صيدلي",
    title_en: "Pharmacist",
    description_ar: "قالب للصيدلة والمجال الدوائي",
    description_en: "Template for pharmacy and pharma roles",
    html: templateHtml("cards"),
    css: makeCss("cards"),
    sort_order: 32,
    default_colors: {
      background_color: "#f5f3ff",
      sidebar_color: "#4c1d95",
      accent_color: "#8b5cf6",
      text_color: "#374151",
      card_color: "#ffffff",
    },
    default_font: { font_family: "Arial", font_size: 14 },
  },
  {
    key: "teacher-educator",
    title_ar: "معلم / تربوي",
    title_en: "Teacher Educator",
    description_ar: "قالب تعليمي للمدرسين والمدربين",
    description_en: "Education template for teachers and trainers",
    html: templateHtml("timeline"),
    css: makeCss("timeline"),
    sort_order: 33,
    default_colors: {
      background_color: "#fffbeb",
      sidebar_color: "#78350f",
      accent_color: "#d97706",
      text_color: "#374151",
      card_color: "#ffffff",
    },
    default_font: { font_family: "Georgia", font_size: 14 },
  },
  {
    key: "academic-researcher",
    title_ar: "باحث أكاديمي",
    title_en: "Academic Researcher",
    description_ar: "قالب أكاديمي للباحثين والمنح والدراسات",
    description_en: "Academic template for researchers",
    html: templateHtml("editorial"),
    css: makeCss("editorial"),
    sort_order: 34,
    default_colors: {
      background_color: "#ffffff",
      sidebar_color: "#111827",
      accent_color: "#4338ca",
      text_color: "#374151",
      card_color: "#ffffff",
    },
    default_font: { font_family: "Times New Roman", font_size: 14 },
  },
  {
    key: "lawyer-legal",
    title_ar: "محامي / قانوني",
    title_en: "Lawyer Legal",
    description_ar: "قالب رسمي للمجال القانوني والاستشارات",
    description_en: "Formal legal and consulting template",
    html: templateHtml("minimal"),
    css: makeCss("minimal"),
    sort_order: 35,
    default_colors: {
      background_color: "#f8fafc",
      sidebar_color: "#111827",
      accent_color: "#7f1d1d",
      text_color: "#374151",
      card_color: "#ffffff",
    },
    default_font: { font_family: "Georgia", font_size: 14 },
  },
  {
    key: "customer-support",
    title_ar: "دعم عملاء",
    title_en: "Customer Support",
    description_ar: "قالب لخدمة العملاء وتجربة المستخدم",
    description_en: "Template for support and customer experience",
    html: templateHtml("banner"),
    css: makeCss("banner"),
    sort_order: 36,
    default_colors: {
      background_color: "#f0f9ff",
      sidebar_color: "#075985",
      accent_color: "#0ea5e9",
      text_color: "#334155",
      card_color: "#ffffff",
    },
    default_font: { font_family: "Arial", font_size: 14 },
  },
  {
    key: "hospitality-hotel",
    title_ar: "ضيافة وفنادق",
    title_en: "Hospitality Hotel",
    description_ar: "قالب للضيافة والفنادق وخدمة الزبائن",
    description_en: "Template for hospitality and hotel roles",
    html: templateHtml("split"),
    css: makeCss("split"),
    sort_order: 37,
    default_colors: {
      background_color: "#fff7ed",
      sidebar_color: "#7c2d12",
      accent_color: "#fb923c",
      text_color: "#374151",
      card_color: "#ffffff",
    },
    default_font: { font_family: "Arial", font_size: 14 },
  },
  {
    key: "retail-store",
    title_ar: "مبيعات تجزئة",
    title_en: "Retail Store",
    description_ar: "قالب عملي للتجزئة والمتاجر وخدمة الزبائن",
    description_en: "Practical retail and store template",
    html: templateHtml("cards"),
    css: makeCss("cards"),
    sort_order: 38,
    default_colors: {
      background_color: "#fefce8",
      sidebar_color: "#713f12",
      accent_color: "#eab308",
      text_color: "#374151",
      card_color: "#ffffff",
    },
    default_font: { font_family: "Arial", font_size: 14 },
  },
  {
    key: "logistics-supply-chain",
    title_ar: "لوجستيات وسلاسل إمداد",
    title_en: "Logistics Supply Chain",
    description_ar: "قالب للوجستيات والمخازن وسلاسل الإمداد",
    description_en: "Template for logistics and supply chain",
    html: templateHtml("grid"),
    css: makeCss("grid"),
    sort_order: 39,
    default_colors: {
      background_color: "#f8fafc",
      sidebar_color: "#1e293b",
      accent_color: "#64748b",
      text_color: "#334155",
      card_color: "#ffffff",
    },
    default_font: { font_family: "Arial", font_size: 14 },
  },
  {
    key: "data-analyst",
    title_ar: "محلل بيانات",
    title_en: "Data Analyst",
    description_ar: "قالب للبيانات والتحليل ولوحات المعلومات",
    description_en: "Template for data analytics roles",
    html: templateHtml("grid"),
    css: makeCss("grid"),
    sort_order: 40,
    default_colors: {
      background_color: "#eef2ff",
      sidebar_color: "#312e81",
      accent_color: "#6366f1",
      text_color: "#334155",
      card_color: "#ffffff",
    },
    default_font: { font_family: "Arial", font_size: 14 },
  },
  {
    key: "cybersecurity-specialist",
    title_ar: "أمن سيبراني",
    title_en: "Cybersecurity Specialist",
    description_ar: "قالب للأمن السيبراني والبنية الأمنية",
    description_en: "Template for cybersecurity specialists",
    html: templateHtml("creative"),
    css: makeCss("creative"),
    sort_order: 41,
    default_colors: {
      background_color: "#020617",
      sidebar_color: "#e2e8f0",
      accent_color: "#22d3ee",
      text_color: "#cbd5e1",
      card_color: "#0f172a",
    },
    default_font: { font_family: "Arial", font_size: 14 },
  },
  {
    key: "devops-cloud",
    title_ar: "DevOps وسحابة",
    title_en: "DevOps Cloud",
    description_ar: "قالب للسحابة والبنية التحتية وDevOps",
    description_en: "Template for cloud and DevOps engineers",
    html: templateHtml("sidebar"),
    css: makeCss("sidebar"),
    sort_order: 42,
    default_colors: {
      background_color: "#f8fafc",
      sidebar_color: "#0f172a",
      accent_color: "#14b8a6",
      text_color: "#334155",
      card_color: "#ffffff",
    },
    default_font: { font_family: "Arial", font_size: 14 },
  },
  {
    key: "mobile-developer",
    title_ar: "مطور تطبيقات موبايل",
    title_en: "Mobile Developer",
    description_ar: "قالب لمطوري Flutter و iOS و Android",
    description_en: "Template for mobile app developers",
    html: templateHtml("cards"),
    css: makeCss("cards"),
    sort_order: 43,
    default_colors: {
      background_color: "#f0fdf4",
      sidebar_color: "#064e3b",
      accent_color: "#22c55e",
      text_color: "#334155",
      card_color: "#ffffff",
    },
    default_font: { font_family: "Arial", font_size: 14 },
  },
  {
    key: "student-intern",
    title_ar: "طالب / متدرب",
    title_en: "Student Intern",
    description_ar: "قالب بسيط للطلاب والمتدربين والخريجين الجدد",
    description_en: "Simple template for students and interns",
    html: templateHtml("minimal"),
    css: makeCss("minimal"),
    sort_order: 44,
    default_colors: {
      background_color: "#ffffff",
      sidebar_color: "#1f2937",
      accent_color: "#3b82f6",
      text_color: "#374151",
      card_color: "#ffffff",
    },
    default_font: { font_family: "Arial", font_size: 14 },
  },
  {
    key: "graduate-entry",
    title_ar: "خريج جديد",
    title_en: "Graduate Entry",
    description_ar: "قالب للخريجين الجدد وبداية المسار المهني",
    description_en: "Entry-level graduate template",
    html: templateHtml("banner"),
    css: makeCss("banner"),
    sort_order: 45,
    default_colors: {
      background_color: "#f8fafc",
      sidebar_color: "#1e293b",
      accent_color: "#8b5cf6",
      text_color: "#334155",
      card_color: "#ffffff",
    },
    default_font: { font_family: "Arial", font_size: 14 },
  },
  {
    key: "freelancer-profile",
    title_ar: "فريلانسر",
    title_en: "Freelancer Profile",
    description_ar: "قالب مرن للمستقلين ومقدمي الخدمات",
    description_en: "Flexible template for freelancers",
    html: templateHtml("creative"),
    css: makeCss("creative"),
    sort_order: 46,
    default_colors: {
      background_color: "#fff1f2",
      sidebar_color: "#881337",
      accent_color: "#f43f5e",
      text_color: "#374151",
      card_color: "#ffffff",
    },
    default_font: { font_family: "Arial", font_size: 14 },
  },
  {
    key: "consultant-strategy",
    title_ar: "استشاري استراتيجي",
    title_en: "Consultant Strategy",
    description_ar: "قالب للاستشارات والاستراتيجية والتحليل",
    description_en: "Consulting strategy resume template",
    html: templateHtml("editorial"),
    css: makeCss("editorial"),
    sort_order: 47,
    default_colors: {
      background_color: "#f8fafc",
      sidebar_color: "#111827",
      accent_color: "#0f766e",
      text_color: "#374151",
      card_color: "#ffffff",
    },
    default_font: { font_family: "Georgia", font_size: 14 },
  },
  {
    key: "real-estate-agent",
    title_ar: "عقارات ومبيعات",
    title_en: "Real Estate Agent",
    description_ar: "قالب للعقارات والمبيعات والعلاقات",
    description_en: "Template for real estate professionals",
    html: templateHtml("split"),
    css: makeCss("split"),
    sort_order: 48,
    default_colors: {
      background_color: "#fefce8",
      sidebar_color: "#422006",
      accent_color: "#ca8a04",
      text_color: "#374151",
      card_color: "#ffffff",
    },
    default_font: { font_family: "Arial", font_size: 14 },
  },
  {
    key: "media-content-creator",
    title_ar: "صانع محتوى وإعلام",
    title_en: "Media Content Creator",
    description_ar: "قالب إبداعي لصناع المحتوى والإعلام",
    description_en: "Creative template for media and content creators",
    html: templateHtml("creative"),
    css: makeCss("creative"),
    sort_order: 49,
    default_colors: {
      background_color: "#faf5ff",
      sidebar_color: "#3b0764",
      accent_color: "#d946ef",
      text_color: "#4b5563",
      card_color: "#ffffff",
    },
    default_font: { font_family: "Arial", font_size: 14 },
  },
  {
    key: "admin-assistant",
    title_ar: "مساعد إداري",
    title_en: "Admin Assistant",
    description_ar: "قالب منظم للمساعدين الإداريين والتنسيق",
    description_en: "Organized template for administrative assistants",
    html: templateHtml("compact"),
    css: makeCss("compact"),
    sort_order: 50,
    default_colors: {
      background_color: "#ffffff",
      sidebar_color: "#111827",
      accent_color: "#64748b",
      text_color: "#374151",
      card_color: "#ffffff",
    },
    default_font: { font_family: "Arial", font_size: 14 },
  },
];
export const generateMissingCvTemplatePreviews = async () => {
  const templates = await CvTemplateModel.find({
    is_active: true,
    $or: [
      { preview_image: { $exists: false } },
      { preview_image: null },
      { preview_image: "" },
    ],
  }).lean();

  for (const template of templates) {
    const previewImage = await generateTemplatePreviewImage(template);

    await CvTemplateModel.updateOne(
      { _id: template._id },
      {
        $set: {
          preview_image: previewImage,
        },
      }
    );
  }

  return templates.length;
};
export const seedCvTemplates = async () => {
  await CvTemplateModel.bulkWrite(
    templates.map((template) => ({
      updateOne: {
        filter: { key: template.key },
        update: {
          $set: {
            ...template,
            is_active: true,
            is_system: true,
          },
        },
        upsert: true,
      },
    }))
  );
  await generateMissingCvTemplatePreviews();
  console.log(`${templates.length} CV templates seeded successfully`);
};
