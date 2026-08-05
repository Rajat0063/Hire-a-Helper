// === Nodemailer transport ===
// Reads SMTP_* env vars. If SMTP_USER is not set we fall back to logging the
// code in the terminal so the OTP / reset flow still works in local dev.
const nodemailer = require("nodemailer");

let transporter;
function getTransporter() {
  if (transporter) return transporter;
  const port = Number(process.env.SMTP_PORT || 587);
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    tls: {
      rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED !== "false",
    },
    connectionTimeout: Number(process.env.SMTP_TIMEOUT || 10000),
  });
  return transporter;
}

async function sendMail({ to, subject, html }) {
  const smtpConfigured = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;
  if (!smtpConfigured) {
    console.warn(`[mailer:WARN] SMTP is not fully configured; email to ${to} will be logged instead.`);
    console.log(`[mailer:DEV] -> ${to} | ${subject}\n${html.replace(/<[^>]+>/g, "")}`);
    return;
  }
  try {
    await getTransporter().sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error(`[mailer:ERROR] Failed to send email to ${to}:`, err && (err.stack || err.message || err));
    throw err;
  }
}

// Verifies SMTP transporter connectivity. This is informational only so
// deployments do not fail when SMTP credentials are misconfigured or absent.
async function verifyTransporter() {
  const smtpConfigured = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;
  if (!smtpConfigured) return false;

  try {
    await getTransporter().verify();
    console.log("[mailer] SMTP transporter verified");
    return true;
  } catch (err) {
    console.warn("[mailer] SMTP transporter verification failed:", err && (err.stack || err.message || err));
    return false;
  }
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

async function sendFeedbackEmail(to, { from, type, subject, message, rating }) {
  await sendMail({
    to,
    subject: `[HireHelper feedback · ${type}] ${subject}`,
    html: `<h2 style="margin:0 0 8px">New ${type} from ${from}</h2>
           <p style="color:#64748b;margin:0 0 12px">Rating: ${rating ? "★".repeat(rating) : "—"}</p>
           <h3 style="margin:12px 0 4px">${subject}</h3>
           <pre style="white-space:pre-wrap;font-family:inherit;background:#f8fafc;padding:12px;border-radius:8px">${message}</pre>
           <p style="color:#94a3b8;font-size:12px">Open the admin dashboard to reply or resolve.</p>`,
  });
}

module.exports = { sendOtpEmail, sendResetEmail, sendFeedbackEmail, verifyTransporter };
