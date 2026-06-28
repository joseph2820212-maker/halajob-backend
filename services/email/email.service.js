import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import { fileURLToPath } from 'url';
import logger from '../../config/logger.js';
import { PRODUCT_NAME, DEFAULT_EMAIL_FROM_NAME } from '../../config/brand.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../..');
const TEMPLATE_DIR = path.join(ROOT_DIR, 'sendEmail', 'templates');

// Hala Job is operated by llill ltd; the public mail domain is halajob.com.
// Env vars override per address. Preferred names are HALAJOB_EMAIL_*; the older
// HALA_EMAIL_* and legacy JOBZAIN_EMAIL_* names remain as backward-compatible
// fallbacks during the brand migration (see BRAND_CLEANUP_AUDIT.md).
const MAIL_DOMAIN = process.env.HALAJOB_MAIL_DOMAIN || process.env.HALA_MAIL_DOMAIN || 'halajob.com';
const FROM_NAME = process.env.HALAJOB_MAIL_FROM_NAME || process.env.HALA_MAIL_FROM_NAME || DEFAULT_EMAIL_FROM_NAME;
const DEFAULT_FROM = {
  info: process.env.HALAJOB_EMAIL_INFO || process.env.HALA_EMAIL_INFO || process.env.JOBZAIN_EMAIL_INFO || `info@${MAIL_DOMAIN}`,
  forgot_password: process.env.HALAJOB_EMAIL_FORGOT_PASSWORD || process.env.HALA_EMAIL_FORGOT_PASSWORD || process.env.JOBZAIN_EMAIL_FORGOT_PASSWORD || `no-reply@${MAIL_DOMAIN}`,
  passcode: process.env.HALAJOB_EMAIL_PASSCODE || process.env.HALA_EMAIL_PASSCODE || process.env.JOBZAIN_EMAIL_PASSCODE || `no-reply@${MAIL_DOMAIN}`,
  subscription: process.env.HALAJOB_EMAIL_SUBSCRIPTION || process.env.HALA_EMAIL_SUBSCRIPTION || process.env.JOBZAIN_EMAIL_SUBSCRIPTION || `billing@${MAIL_DOMAIN}`,
  checkout: process.env.HALAJOB_EMAIL_CHECKOUT || process.env.HALA_EMAIL_CHECKOUT || process.env.JOBZAIN_EMAIL_CHECKOUT || `billing@${MAIL_DOMAIN}`,
  contact: process.env.HALAJOB_EMAIL_CONTACT || process.env.HALA_EMAIL_CONTACT || process.env.JOBZAIN_EMAIL_CONTACT || `support@${MAIL_DOMAIN}`,
  appointments: process.env.HALAJOB_EMAIL_APPOINTMENTS || process.env.HALA_EMAIL_APPOINTMENTS || process.env.JOBZAIN_EMAIL_APPOINTMENTS || `no-reply@${MAIL_DOMAIN}`,
};

let transporter = null;

export const htmlEscape = (value = '') => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const getSmtpConfig = () => ({
  host: process.env.SMTP_HOST || 'smtp.hostinger.com',
  port: Number(process.env.SMTP_PORT || 465),
  secure: String(process.env.SMTP_SECURE ?? 'true') !== 'false',
  auth: {
    user: process.env.SMTP_USER || DEFAULT_FROM.info,
    pass: process.env.SMTP_PASS,
  },
});

export function getTransporter() {
  if (transporter) return transporter;

  const config = getSmtpConfig();
  if (!config.auth.pass) {
    console.warn('SMTP_PASS is missing. Emails will fail until SMTP credentials are configured.');
  }

  transporter = nodemailer.createTransport(config);
  return transporter;
}

export function renderTemplate(templateName, variables = {}) {
  const file = path.join(TEMPLATE_DIR, `${templateName}.html`);
  const fallbackFile = path.join(TEMPLATE_DIR, 'base.html');
  const templatePath = fs.existsSync(file) ? file : fallbackFile;
  let html = fs.readFileSync(templatePath, 'utf8');

  const safeVariables = {
    app_name: PRODUCT_NAME,
    year: new Date().getFullYear(),
    support_email: DEFAULT_FROM.info,
    ...variables,
  };

  Object.entries(safeVariables).forEach(([key, value]) => {
    const escaped = key.endsWith('_html') ? String(value ?? '') : htmlEscape(value);
    html = html.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), escaped);
  });

  html = html.replace(/{{\s*\w+\s*}}/g, '');
  return html;
}

export async function sendJobzainEmail({
  to,
  subject,
  template = 'base',
  variables = {},
  fromKey = 'info',
  from,
  replyTo,
} = {}) {
  if (!to) throw new Error('email_to_required');

  const fromAddress = from || DEFAULT_FROM[fromKey] || DEFAULT_FROM.info;
  const html = renderTemplate(template, variables);

  let info;
  try {
    info = await getTransporter().sendMail({
      from: `${FROM_NAME} <${fromAddress}>`,
      to,
      subject: subject || PRODUCT_NAME,
      html,
      replyTo: replyTo || fromAddress,
    });
  } catch (err) {
    // Log SMTP failures (observability) and surface a stable, safe error.
    logger.error({ scope: 'email', to, subject, message: err?.message });
    throw new Error('email_send_failed');
  }

  return info;
}

export async function sendPasscodeEmail({ to, passcode, lang = 'en', type = 'passcode' } = {}) {
  const isArabic = String(lang || '').toLowerCase() === 'ar';
  const subject = isArabic ? 'رمز التحقق من هلا جوب' : 'Hala Job verification code';

  return sendJobzainEmail({
    to,
    subject,
    template: 'passcode',
    fromKey: type === 'forgot_password' ? 'forgot_password' : 'passcode',
    variables: {
      lang: isArabic ? 'ar' : 'en',
      direction: isArabic ? 'rtl' : 'ltr',
      title: subject,
      intro: isArabic
        ? 'استخدم رمز التحقق التالي لإكمال العملية المطلوبة.'
        : 'Use the following verification code to complete your request.',
      passcode,
      note: isArabic
        ? 'ينتهي هذا الرمز خلال فترة قصيرة. لا تشاركه مع أي شخص.'
        : 'This code expires soon. Do not share it with anyone.',
    },
  });
}

export async function sendImportantActionEmail({ to, subject, title, message, actionUrl, actionLabel, lang = 'en', fromKey = 'info' } = {}) {
  const isArabic = String(lang || '').toLowerCase() === 'ar';
  return sendJobzainEmail({
    to,
    subject,
    template: 'important-action',
    fromKey,
    variables: {
      lang: isArabic ? 'ar' : 'en',
      direction: isArabic ? 'rtl' : 'ltr',
      title: title || subject,
      message,
      action_url: actionUrl,
      action_label: actionLabel || (isArabic ? 'فتح هلا جوب' : 'Open Hala Job'),
    },
  });
}

export { DEFAULT_FROM as JOBZAIN_EMAILS, DEFAULT_FROM, FROM_NAME, MAIL_DOMAIN };

export default {
  sendJobzainEmail,
  sendPasscodeEmail,
  sendImportantActionEmail,
  renderTemplate,
  getTransporter,
  JOBZAIN_EMAILS: DEFAULT_FROM,
};
