// === Nodemailer transport ===
// Reads SMTP_* env vars. If SMTP_USER is not set we fall back to logging the
// code in the terminal so the OTP / reset flow still works in local dev.
const nodemailer = require("nodemailer");

let transporter;
function getTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return transporter;
}

async function sendMail({ to, subject, html }) {
  if (!process.env.SMTP_USER) {
    console.log(`[mailer:DEV] -> ${to} | ${subject}\n${html.replace(/<[^>]+>/g, "")}`);
    return;
  }
  await getTransporter().sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    html,
  });
}

async function sendOtpEmail(to, code) {
  await sendMail({
    to,
    subject: "Your HireHelper verification code",
    html: `<p>Your verification code is <b style="font-size:22px">${code}</b>. It expires in 10 minutes.</p>`,
  });
}

async function sendResetEmail(to, code) {
  await sendMail({
    to,
    subject: "HireHelper password reset code",
    html: `<p>Use the code below to reset your HireHelper password. It expires in 10 minutes.</p>
           <p style="font-size:26px;font-weight:800;letter-spacing:6px">${code}</p>
           <p>If you did not request this, you can safely ignore the email.</p>`,
  });
}

module.exports = { sendOtpEmail, sendResetEmail };
