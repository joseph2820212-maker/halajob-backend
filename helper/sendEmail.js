import nodemailer from "nodemailer";
import fs from "fs";
export async function sendRecoveryEmail({to, passcode}) {
  try {
    // قراءة قالب HTML
    const template = fs.readFileSync('./sendEmail/recovery.html', 'utf8');

    // استبدال المتغيرات في القالب
    const htmlContent = template
      .replace('{{passcode}}', passcode);

    // إعداد المرسل
    const transporter = nodemailer.createTransport({
      host: 'smtp.hostinger.com',
      port: 465,
      secure: true,
      auth: {
        user: 'info@llill.com',
        pass: 'Btncctv2012@'
      }
    });

    // إعداد محتوى الرسالة
    const mailOptions = {
      from: 'info@llill.com',
      to,
      subject: 'Password Recovery',
      html: htmlContent
    };

    // إرسال الرسالة
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent:', info.response);
  } catch (error) {
    console.error('❌ Error sending email:', error);
  }
}
