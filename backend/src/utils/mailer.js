// === Nodemailer transport ===
// Reads SMTP_* env vars. In development it falls back to Ethereal preview mail if
// SMTP is not configured, so OTP and password reset flows still work.
const nodemailer = require("nodemailer");

let transporter;
let usingEthereal = false;

async function getTransporter() {
  if (transporter) return transporter;

  const smtpConfigured = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;
  if (!smtpConfigured) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SMTP is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS to send emails in production.");
    }
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: { user: testAccount.user, pass: testAccount.pass },
      connectionTimeout: Number(process.env.SMTP_TIMEOUT || 20000),
      greetingTimeout: Number(process.env.SMTP_TIMEOUT || 20000),
      socketTimeout: Number(process.env.SMTP_TIMEOUT || 20000),
    });
    usingEthereal = true;
    console.warn("[mailer:DEV] SMTP is not configured; using Ethereal preview mail account.");
    return transporter;
  }

  const port = Number(process.env.SMTP_PORT || 587);
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    tls: {
      rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED !== "false",
    },
    connectionTimeout: Number(process.env.SMTP_TIMEOUT || 20000),
    greetingTimeout: Number(process.env.SMTP_TIMEOUT || 20000),
    socketTimeout: Number(process.env.SMTP_TIMEOUT || 20000),
  });
  return transporter;
}

async function sendMail({ to, subject, html }) {
  const message = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER || "HireHelper <no-reply@hirehelper.com>",
    to,
    subject,
    html,
  };

  const transport = await getTransporter();
  try {
    const info = await transport.sendMail(message);
    if (usingEthereal) {
      console.log(`[mailer:DEV] Email preview URL: ${nodemailer.getTestMessageUrl(info)}`);
      console.log(`[mailer:DEV] -> ${to} | ${subject}\n${html.replace(/<[^>]+>/g, "")}`);
    }
    return info;
  } catch (err) {
    console.error("[mailer:error]", err && (err.stack || err.message || err));
    transporter = null;
    usingEthereal = false;

    const port = Number(process.env.SMTP_PORT || 587);
    const canRetryWith465 = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && port === 587;
    if (canRetryWith465 && err.code && err.code.toString().includes("ETIMEDOUT")) {
      try {
        console.warn("[mailer:retry] primary SMTP port timed out. Retrying on port 465 with secure connection.");
        const fallbackTransport = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: 465,
          secure: true,
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
          tls: { rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED !== "false" },
          connectionTimeout: Number(process.env.SMTP_TIMEOUT || 20000),
          greetingTimeout: Number(process.env.SMTP_TIMEOUT || 20000),
          socketTimeout: Number(process.env.SMTP_TIMEOUT || 20000),
        });
        const info = await fallbackTransport.sendMail(message);
        console.warn("[mailer:retry] email sent on fallback SMTP port 465.");
        return info;
      } catch (fallbackErr) {
        console.error("[mailer:retry-error]", fallbackErr && (fallbackErr.stack || fallbackErr.message || fallbackErr));
      }
    }
    return null;
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
    subject: "Your HireHelper password reset code",
    html: `<p>Your password reset code is <b style="font-size:22px">${code}</b>. It expires in 10 minutes.</p>
           <p>If you did not request this, you can safely ignore this email.</p>`,
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

module.exports = { sendOtpEmail, sendResetEmail, sendFeedbackEmail };
