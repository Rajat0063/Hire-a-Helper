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
    connectionTimeout: Number(process.env.SMTP_TIMEOUT || 30000),
    greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT || 30000),
    socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT || 30000),
    pool: process.env.SMTP_POOL === "true",
  });
  return transporter;
}

function isSmtpConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function buildFromAddress() {
  const smtpUser = String(process.env.SMTP_USER || "").trim().toLowerCase();
  const smtpFrom = String(process.env.SMTP_FROM || "").trim();
  const smtpFromEmail = smtpFrom.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0]?.toLowerCase() || "";

  if (!smtpUser) return "";
  if (!smtpFrom) return smtpUser;
  if (smtpFromEmail && smtpFromEmail !== smtpUser) {
    console.warn(`[mailer:WARN] SMTP_FROM (${smtpFromEmail}) does not match SMTP_USER (${smtpUser}). Gmail delivery is usually tied to the authenticated sender. Falling back to SMTP_USER.`);
    return smtpUser;
  }
  return smtpFrom;
}

async function sendMail({ to, subject, html }) {
  if (!isSmtpConfigured()) {
    console.warn(`[mailer:WARN] SMTP is not fully configured; email to ${to} will be logged instead.`);
    console.log(`[mailer:DEV] -> ${to} | ${subject}\n${html.replace(/<[^>]+>/g, "")}`);
    return { delivered: false, devMode: true };
  }
  try {
    await getTransporter().sendMail({
      from: buildFromAddress(),
      to,
      subject,
      html,
    });
    return { delivered: true, devMode: false };
  } catch (err) {
    console.error(`[mailer:ERROR] Failed to send email to ${to}:`, err && (err.stack || err.message || err));
    return { delivered: false, devMode: false, error: err };
  }
}

// SMTP connectivity is verified lazily only when mail is actually sent.
// Keeping startup silent avoids noisy Render deployment logs when the
// outbound SMTP provider is slow or not available in the runtime environment.
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
  return await sendMail({
    to,
    subject: "Your HireHelper verification code",
    html: `<p>Your verification code is <b style="font-size:22px">${code}</b>. It expires in 10 minutes.</p>`,
  });
}

async function sendResetEmail(to, code) {
  return await sendMail({
    to,
    subject: "HireHelper password reset code",
    html: `<p>Use the code below to reset your HireHelper password. It expires in 10 minutes.</p>
           <p style="font-size:26px;font-weight:800;letter-spacing:6px">${code}</p>
           <p>If you did not request this, you can safely ignore the email.</p>`,
  });
}

async function sendFeedbackEmail(to, { from, type, subject, message, rating }) {
  return await sendMail({
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
