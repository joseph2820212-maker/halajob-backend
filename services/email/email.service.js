import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../..');
const TEMPLATE_DIR = path.join(ROOT_DIR, 'sendEmail', 'templates');

const DEFAULT_FROM = {
  info: process.env.JOBZAIN_EMAIL_INFO || 'info@jobzain.com',
  forgot_password: process.env.JOBZAIN_EMAIL_FORGOT_PASSWORD || 'forgot.password@jobzain.com',
  passcode: process.env.JOBZAIN_EMAIL_PASSCODE || 'passcode@jobzain.com',
  subscription: process.env.JOBZAIN_EMAIL_SUBSCRIPTION || 'subscription@jobzain.com',
  checkout: process.env.JOBZAIN_EMAIL_CHECKOUT || 'checkout@jobzain.com',
  contact: process.env.JOBZAIN_EMAIL_CONTACT || 'contact@jobzain.com',
  appointments: process.env.JOBZAIN_EMAIL_APPOINTMENTS || 'appointments@jobzain.com',
};

let transporter = null;

const htmlEscape = (value = '') => String(value ?? '')
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
    app_name: 'JobZain',
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

  const info = await getTransporter().sendMail({
    from: `JobZain <${fromAddress}>`,
    to,
    subject: subject || 'JobZain',
    html,
    replyTo: replyTo || fromAddress,
  });

  return info;
}

export async function sendPasscodeEmail({ to, passcode, lang = 'en', type = 'passcode' } = {}) {
  const isArabic = String(lang || '').toLowerCase() === 'ar';
  const subject = isArabic ? 'رمز التحقق من JobZain' : 'JobZain verification code';

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
      action_label: actionLabel || (isArabic ? 'فتح JobZain' : 'Open JobZain'),
    },
  });
}

export { DEFAULT_FROM as JOBZAIN_EMAILS };

export default {
  sendJobzainEmail,
  sendPasscodeEmail,
  sendImportantActionEmail,
  renderTemplate,
  getTransporter,
  JOBZAIN_EMAILS: DEFAULT_FROM,
};
