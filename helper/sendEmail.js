import { sendPasscodeEmail, sendJobzainEmail, sendImportantActionEmail } from '../services/email/email.service.js';

// Backward-compatible name used by current auth controllers.
export async function sendRecoveryEmail({ to, passcode, lang = 'en', type = 'passcode' }) {
  try {
    return await sendPasscodeEmail({ to, passcode, lang, type });
  } catch (error) {
    console.error('❌ Error sending email:', error?.message || error);
    return null;
  }
}

export { sendJobzainEmail, sendImportantActionEmail };

export default {
  sendRecoveryEmail,
  sendJobzainEmail,
  sendImportantActionEmail,
};
