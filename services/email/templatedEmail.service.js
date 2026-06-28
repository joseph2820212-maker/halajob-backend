// Send-time delivery for the seeded EmailTemplateModel catalogue (69 templates).
//
// Flow: load a published template by key -> render its bilingual bodyBlocks into
// a Hala Job branded HTML shell -> honour the recipient's communication
// preferences (marketing/job-alert can be unsubscribed; transactional/critical
// notices always send) -> send through the shared SMTP transporter -> record an
// EmailLogModel row (queued -> sent | failed | suppressed) for observability and
// the admin email-log queue.
//
// Controllers should call dispatchTemplatedEmail(...) — it never throws, so a
// mail failure cannot break the request that triggered it.

import {
  getTransporter,
  htmlEscape,
  FROM_NAME,
  DEFAULT_FROM,
} from "./email.service.js";
import {
  EmailTemplateModel,
  EmailLogModel,
  CommunicationPreferenceModel,
} from "../../models/index.js";
import logger from "../../config/logger.js";

const ARABIC = "ar";

const pickLang = (lang) => (String(lang || "").toLowerCase() === ARABIC ? ARABIC : "en");

// Replace {{var}} tokens from the variables map. Keys ending in _html are
// trusted (already-safe markup); everything else is HTML-escaped.
const substitute = (text = "", variables = {}, { escapeValues = true } = {}) =>
  String(text ?? "").replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key) => {
    if (!(key in variables)) return ""; // drop unresolved tokens rather than leak braces
    const value = variables[key];
    if (key.endsWith("_html")) return String(value ?? "");
    return escapeValues ? htmlEscape(value) : String(value ?? "");
  });

const BLOCK_RENDERERS = {
  greeting: (text) => `<p style="margin:0 0 16px;font-size:16px;font-weight:600;color:#1F3654;">${text}</p>`,
  paragraph: (text) => `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#2b3a52;">${text}</p>`,
  code: (text) => `<p style="margin:0 0 16px;"><span style="display:inline-block;font-size:26px;letter-spacing:6px;font-weight:700;color:#1F3654;background:#FCF7EF;border:1px solid #EBDAC2;border-radius:12px;padding:12px 22px;">${text}</span></p>`,
  unsubscribe: (text) => `<p style="margin:18px 0 0;font-size:12px;color:#8a93a5;">${text}</p>`,
  footer: (text) => `<p style="margin:16px 0 0;font-size:12px;line-height:1.7;color:#64748b;">${text}</p>`,
};

const renderButton = (label, url) =>
  `<p style="margin:8px 0 20px;"><a href="${url}" style="display:inline-block;background:#E38B3C;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:13px 26px;border-radius:12px;">${label}</a></p>`;

const renderBlocks = (blocks, lang, variables) => {
  const parts = [];
  for (const block of blocks || []) {
    const raw = block?.text?.[lang] ?? block?.text?.en ?? "";
    const text = substitute(raw, variables);
    const renderer = BLOCK_RENDERERS[block?.type];
    if (renderer) {
      if (!text) continue;
      parts.push(renderer(text));
    } else {
      // Unknown block types fall back to a paragraph so content is never lost.
      if (text) parts.push(BLOCK_RENDERERS.paragraph(text));
    }
  }
  // An explicit call-to-action button, driven by variables (no template change needed).
  if (variables.actionUrl && variables.actionLabel) {
    const label = htmlEscape(variables.actionLabel);
    const url = htmlEscape(variables.actionUrl);
    // Insert the button before the footer block, if present.
    const footerIdx = (blocks || []).findIndex((b) => b?.type === "footer");
    const button = renderButton(label, url);
    if (footerIdx >= 0 && parts.length >= 1) parts.splice(parts.length - 1, 0, button);
    else parts.push(button);
  }
  return parts.join("\n");
};

const wrapShell = ({ lang, title, contentHtml, year }) => {
  const dir = lang === ARABIC ? "rtl" : "ltr";
  return `<!doctype html>
<html lang="${lang}" dir="${dir}">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>${title}</title></head>
<body style="margin:0;background:#FCF7EF;font-family:Arial,Tahoma,sans-serif;color:#1F3654;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FCF7EF;padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #EBDAC2;">
        <tr><td style="padding:26px 28px;background:#1F3654;color:#ffffff;">
          <h1 style="margin:0;font-size:22px;line-height:1.4;">Hala Job</h1>
          ${title ? `<p style="margin:6px 0 0;font-size:14px;opacity:.9;">${title}</p>` : ""}
        </td></tr>
        <tr><td style="padding:30px 28px;" dir="${dir}">
          ${contentHtml}
        </td></tr>
        <tr><td style="padding:16px 28px;background:#FFFAF2;color:#8a93a5;font-size:12px;line-height:1.7;border-top:1px solid #EBDAC2;">
          © ${year} Hala Job · ${htmlEscape(DEFAULT_FROM.contact)}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
};

/**
 * Pure render: turn a template document into { subject, html, lang }.
 * Exported so tests can render without a database or SMTP.
 */
export function renderTemplateDoc(doc, { lang = "en", variables = {} } = {}) {
  if (!doc) throw new Error("email_template_missing");
  const useLang = pickLang(lang);
  const subjectRaw = doc.subject?.[useLang] || doc.subject?.en || "";
  const subject = substitute(subjectRaw, variables, { escapeValues: false }).trim();
  const contentHtml = renderBlocks(doc.bodyBlocks, useLang, variables);
  const year = new Date().getFullYear();
  const html = wrapShell({ lang: useLang, title: subject, contentHtml, year });
  return { subject, html, lang: useLang };
}

// Marketing/job-alert templates are gated by the recipient's preferences.
// Critical/transactional templates (account, privacy, billing, security) always send.
const isJobAlertKey = (key = "") => key.includes("matching_jobs") || key.includes("job_deadline") || key.includes("saved_job");

const shouldSuppress = async (doc, userId) => {
  if (!doc.isMarketing || !userId) return { suppressed: false };
  const pref = await CommunicationPreferenceModel.findOne({ userId }).select("marketingEmail jobAlertEmail").lean();
  if (!pref) return { suppressed: false }; // default opt-in
  if (isJobAlertKey(doc.key)) {
    if (pref.jobAlertEmail === false) return { suppressed: true, reason: "job_alert_opt_out" };
  }
  if (pref.marketingEmail === false) return { suppressed: true, reason: "marketing_opt_out" };
  return { suppressed: false };
};

/**
 * Render + send a catalogue template, recording an EmailLog row.
 * Throws on missing template / SMTP error (use dispatchTemplatedEmail for
 * fire-and-forget from request handlers).
 *
 * @returns {Promise<{status:'sent'|'failed'|'suppressed', logId, providerMessageId?, error?, reason?}>}
 */
export async function sendTemplatedEmail({
  templateKey,
  to,
  lang = "en",
  variables = {},
  userId = null,
  role = "",
  fromKey = "info",
  from,
  replyTo,
  force = false,
  template = null,
} = {}) {
  if (!to) throw new Error("email_to_required");

  const doc = template || (await EmailTemplateModel.findOne({ key: templateKey, status: "published" }).lean());
  if (!doc) throw new Error(`email_template_not_found:${templateKey}`);

  const { subject, html } = renderTemplateDoc(doc, { lang, variables });

  let suppressed = { suppressed: false };
  if (!force) suppressed = await shouldSuppress(doc, userId);

  const log = await EmailLogModel.create({
    templateKey: doc.key,
    recipientEmail: to,
    userId: userId || null,
    role: role || "",
    subject,
    status: suppressed.suppressed ? "suppressed" : "queued",
    error: suppressed.suppressed ? suppressed.reason || "suppressed" : "",
  });

  if (suppressed.suppressed) {
    return { status: "suppressed", logId: log._id, reason: suppressed.reason };
  }

  const fromAddress = from || DEFAULT_FROM[fromKey] || DEFAULT_FROM.info;
  try {
    const info = await getTransporter().sendMail({
      from: `${FROM_NAME} <${fromAddress}>`,
      to,
      subject: subject || "Hala Job",
      html,
      replyTo: replyTo || doc.replyTo || fromAddress,
    });
    await EmailLogModel.updateOne(
      { _id: log._id },
      { $set: { status: "sent", providerMessageId: info?.messageId || "", sentAt: new Date() } }
    );
    return { status: "sent", logId: log._id, providerMessageId: info?.messageId || "" };
  } catch (err) {
    const message = err?.message || "email_send_failed";
    await EmailLogModel.updateOne({ _id: log._id }, { $set: { status: "failed", error: message } });
    logger.error({ scope: "templated-email", templateKey: doc.key, to, message });
    return { status: "failed", logId: log._id, error: message };
  }
}

/**
 * Fire-and-forget wrapper for request handlers. Never throws: logs and returns
 * null on any failure so the triggering request always completes.
 */
export async function dispatchTemplatedEmail(options = {}) {
  try {
    return await sendTemplatedEmail(options);
  } catch (err) {
    logger.error({ scope: "templated-email", templateKey: options?.templateKey, message: err?.message || String(err) });
    return null;
  }
}

export default {
  renderTemplateDoc,
  sendTemplatedEmail,
  dispatchTemplatedEmail,
};
