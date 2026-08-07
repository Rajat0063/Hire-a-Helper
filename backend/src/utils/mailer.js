// === Nodemailer transport ===
// Reads SMTP_* env vars or RESEND_API_KEY.
// Note: Hosting platforms like Render block outbound SMTP ports (587, 465, 25).
// For reliable email delivery on Render, set RESEND_API_KEY (from resend.com - free API).
const nodemailer = require("nodemailer");

let transporter;
function getTransporter() {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || 587);
  const isGmail = host.includes("gmail") || process.env.SMTP_SERVICE === "gmail";
  const cleanPass = (process.env.SMTP_PASS || "").replace(/\s+/g, "");

  const config = isGmail
    ? {
        service: "gmail",
        auth: { user: process.env.SMTP_USER, pass: cleanPass },
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 5000,
      }
    : {
        host,
        port,
        secure: process.env.SMTP_SECURE === "true" || port === 465,
        auth: { user: process.env.SMTP_USER, pass: cleanPass },
        tls: { rejectUnauthorized: false },
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 5000,
      };

  transporter = nodemailer.createTransport(config);
  return transporter;
}

function isSmtpConfigured() {
  return Boolean(
    process.env.RESEND_API_KEY ||
      (process.env.SMTP_USER && process.env.SMTP_PASS)
  );
}

async function sendMail({ to, subject, html }) {
  if (!isSmtpConfigured()) {
    console.warn(`[mailer:WARN] Email service not configured; email to ${to} will be logged to console.`);
    console.log(`[mailer:DEV] -> ${to} | ${subject}\n${html.replace(/<[^>]+>/g, "")}`);
    return { sent: false, smtpConfigured: false };
  }

  const fromName = process.env.SMTP_FROM_NAME || "HireHelper";
  const fromUser = process.env.SMTP_USER || "onboarding@resend.dev";
  const fromAddress = process.env.SMTP_FROM || `"${fromName}" <${fromUser}>`;

  // 1. Try Resend API first if key is provided (bypasses Render SMTP port blocking via HTTPS port 443)
  if (process.env.RESEND_API_KEY) {
    try {
      const resendFrom = process.env.RESEND_FROM || process.env.SMTP_FROM || `${fromName} <onboarding@resend.dev>`;
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: resendFrom,
          to: [to],
          subject,
          html,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        console.log(`[mailer:resend] Email sent successfully to ${to} (id: ${data.id})`);
        return { sent: true, provider: "resend" };
      }
      console.error("[mailer:resend:ERROR]", data);
    } catch (rErr) {
      console.error("[mailer:resend:FETCH_ERROR]", rErr?.message || rErr);
    }
  }

  // 2. Fall back to Nodemailer SMTP
  try {
    await getTransporter().sendMail({
      from: fromAddress,
      to,
      subject,
      html,
    });
    console.log(`[mailer:smtp] Email sent successfully to ${to} from ${fromAddress}`);
    return { sent: true, provider: "smtp" };
  } catch (err) {
    console.error(`[mailer:ERROR] Failed to send email to ${to} via SMTP:`, err?.message || err);
    console.warn(`[mailer:NOTICE] Cloud hosts like Render block outbound SMTP ports (587/465). Consider adding RESEND_API_KEY.`);
    return { sent: false, error: err?.message || String(err) };
  }
}

async function verifyTransporter() {
  if (process.env.RESEND_API_KEY) {
    console.log("[mailer] Using Resend HTTP API for emails");
    return true;
  }
  if (!isSmtpConfigured()) {
    console.log("[mailer] No SMTP or Resend credentials provided; running in console logging mode");
    return false;
  }
  try {
    await getTransporter().verify();
    console.log("[mailer] SMTP transporter verified");
    return true;
  } catch (err) {
    console.warn("[mailer] SMTP verification failed (Render blocks SMTP ports 587/465). Will attempt sending on demand or use fallback log:", err?.message || err);
    return false;
  }
}

async function sendOtpEmail(to, code) {
  console.log(`\n==================================================`);
  console.log(` [OTP CODE FOR ${to}]: ${code}`);
  console.log(`==================================================\n`);
  return await sendMail({
    to,
    subject: "Your HireHelper verification code",
    html: `...`,
  });
}

async function sendResetEmail(to, code) {
  console.log(`\n==================================================`);
  console.log(` [PASSWORD RESET CODE FOR ${to}]: ${code}`);
  console.log(`==================================================\n`);
  return await sendMail({
    to,
    subject: "HireHelper password reset code",
    html: `...`,
  });
}

async function sendFeedbackEmail(to, { from, type, subject, message, rating }) { ... }

module.exports = { sendOtpEmail, sendResetEmail, sendFeedbackEmail, verifyTransporter, isSmtpConfigured };