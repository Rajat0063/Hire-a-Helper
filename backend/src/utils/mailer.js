// === Nodemailer transport ===
// Reads SMTP_* env vars. In development it falls back to Ethereal preview mail if
// SMTP is not configured, so OTP and password reset flows still work.
const nodemailer = require("nodemailer");

let transporter;
let usingEthereal = false;

function normalizeEnvValue(value) {
  if (value === undefined || value === null) return undefined;
  return String(value).trim().replace(/^"|"$/g, "").replace(/^'|'$/g, "").trim();
}

function parseBool(value, fallback = false) {
  if (value === undefined || value === null) return fallback;
  const normalized = normalizeEnvValue(value).toLowerCase();
  return normalized === "true" || normalized === "1";
}

function getSmtpConfig() {
  const host = normalizeEnvValue(process.env.SMTP_HOST) || normalizeEnvValue(process.env.MAIL_HOST) || normalizeEnvValue(process.env.EMAIL_HOST);
  const user = normalizeEnvValue(process.env.SMTP_USER) || normalizeEnvValue(process.env.MAIL_USER) || normalizeEnvValue(process.env.EMAIL_USER);
  const pass = normalizeEnvValue(process.env.SMTP_PASS) || normalizeEnvValue(process.env.MAIL_PASS) || normalizeEnvValue(process.env.EMAIL_PASS);
  const from = normalizeEnvValue(process.env.SMTP_FROM) || normalizeEnvValue(process.env.MAIL_FROM) || normalizeEnvValue(process.env.EMAIL_FROM);
  const port = Number(normalizeEnvValue(process.env.SMTP_PORT) || normalizeEnvValue(process.env.MAIL_PORT) || normalizeEnvValue(process.env.EMAIL_PORT) || 587) || 587;
  const secure = parseBool(process.env.SMTP_SECURE || process.env.MAIL_SECURE || process.env.EMAIL_SECURE, port === 465);
  return {
    host,
    port,
    secure,
    auth: { user, pass },
    from,
    tls: { rejectUnauthorized: !parseBool(process.env.SMTP_REJECT_UNAUTHORIZED, true) ? false : true },
    connectionTimeout: Number(normalizeEnvValue(process.env.SMTP_TIMEOUT) || normalizeEnvValue(process.env.MAIL_TIMEOUT) || normalizeEnvValue(process.env.EMAIL_TIMEOUT) || 20000),
    greetingTimeout: Number(normalizeEnvValue(process.env.SMTP_TIMEOUT) || normalizeEnvValue(process.env.MAIL_TIMEOUT) || normalizeEnvValue(process.env.EMAIL_TIMEOUT) || 20000),
    socketTimeout: Number(normalizeEnvValue(process.env.SMTP_TIMEOUT) || normalizeEnvValue(process.env.MAIL_TIMEOUT) || normalizeEnvValue(process.env.EMAIL_TIMEOUT) || 20000),
  };
}

function hasSmtpConfig() {
  const config = getSmtpConfig();
  return Boolean(config.host && config.auth.user && config.auth.pass);
}

async function createTransport(config) {
  return nodemailer.createTransport(config);
}

async function getTransporter() {
  if (transporter) return transporter;

  if (!hasSmtpConfig()) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SMTP is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS to send emails in production.");
    }
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: { user: testAccount.user, pass: testAccount.pass },
      connectionTimeout: Number(normalizeEnvValue(process.env.SMTP_TIMEOUT) || 20000),
      greetingTimeout: Number(normalizeEnvValue(process.env.SMTP_TIMEOUT) || 20000),
      socketTimeout: Number(normalizeEnvValue(process.env.SMTP_TIMEOUT) || 20000),
    });
    usingEthereal = true;
    console.warn("[mailer:DEV] SMTP is not configured; using Ethereal preview mail account.");
    return transporter;
  }

  const config = getSmtpConfig();
  transporter = await createTransport(config);
  return transporter;
}

async function sendMail({ to, subject, html }) {
  const smtpConfig = getSmtpConfig();
  const message = {
    from: smtpConfig.from || smtpConfig.auth.user || "HireHelper <no-reply@hirehelper.com>",
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

    if (hasSmtpConfig()) {
      const smtpConfig = getSmtpConfig();
      const fallbackPorts = [465, 587, 2525, 25].filter((p) => p !== smtpConfig.port);
      for (const fallbackPort of fallbackPorts) {
        try {
          console.warn(`[mailer:retry] Attempting fallback SMTP port ${fallbackPort}`);
          const config = {
            ...smtpConfig,
            port: fallbackPort,
            secure: fallbackPort === 465 || smtpConfig.secure,
          };
          const fallbackTransport = await createTransport(config);
          const info = await fallbackTransport.sendMail(message);
          console.warn(`[mailer:retry] email sent on fallback SMTP port ${fallbackPort}.`);
          return info;
        } catch (fallbackErr) {
          console.error(`[mailer:retry-error:${fallbackPort}]`, fallbackErr && (fallbackErr.stack || fallbackErr.message || fallbackErr));
        }
      }
    }

    if (!hasSmtpConfig()) {
      console.warn("[mailer] No SMTP configuration found; email send was skipped.");
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
