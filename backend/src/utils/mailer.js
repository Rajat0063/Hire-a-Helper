// === Nodemailer transport ===
// Reads SMTP_* env vars. If SMTP_USER is not set we fall back to logging the
// code in the terminal so the OTP / reset flow still works in local dev.
const nodemailer = require("nodemailer");

let transporter;
function getTransporter() {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || 587);
  const isGmail = host.includes("gmail") || process.env.SMTP_SERVICE === "gmail";

  const config = {
    host: isGmail ? "smtp.gmail.com" : host,
    port: isGmail ? 587 : port,
    secure: isGmail ? false : (process.env.SMTP_SECURE === "true" || port === 465),
    requireTLS: isGmail ? true : undefined,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    tls: {
      rejectUnauthorized: false,
      ciphers: "SSLv3",
    },
    pool: true,
    maxConnections: 3,
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000,
  };

  transporter = nodemailer.createTransport(config);
  return transporter;
}

function isSmtpConfigured() {
  return Boolean(process.env.RESEND_API_KEY || (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS));
}

async function sendMail({ to, subject, html }) {
  if (!isSmtpConfigured()) {
    console.warn(`[mailer:WARN] Email service is not fully configured; email to ${to} will be logged instead.`);
    console.log(`[mailer:DEV] -> ${to} | ${subject}\n${html.replace(/<[^>]+>/g, "")}`);
    return { sent: false, smtpConfigured: false };
  }

  const fromName = process.env.SMTP_FROM_NAME || "HireHelper";
  const fromUser = process.env.SMTP_USER || "onboarding@resend.dev";
  const fromAddress = process.env.SMTP_FROM || `"${fromName}" <${fromUser}>`;

  // 1. Try Resend API if key is set (bypasses Render SMTP port blocking)
  if (process.env.RESEND_API_KEY) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.SMTP_FROM || `${fromName} <onboarding@resend.dev>`,
          to: [to],
          subject,
          html,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        console.log(`[mailer:resend] Sent email successfully to ${to} (id: ${data.id})`);
        return { sent: true, smtpConfigured: true };
      }
      console.error("[mailer:resend:ERROR]", data);
    } catch (rErr) {
      console.error("[mailer:resend:FETCH_ERROR]", rErr && (rErr.stack || rErr.message || rErr));
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
    console.log(`[mailer:smtp] Sent email successfully to ${to} from ${fromAddress}`);
    return { sent: true, smtpConfigured: true };
  } catch (err) {
    console.error(`[mailer:ERROR] Failed to send email to ${to}:`, err && (err.stack || err.message || err));
    return { sent: false, smtpConfigured: true, error: err?.message || String(err) };
  }
}

// Verifies SMTP transporter connectivity; returns a promise that resolves
// when verification succeeds or fails gracefully.
async function verifyTransporter() {
  if (process.env.RESEND_API_KEY) {
    console.log("[mailer] Using Resend HTTP API for emails");
    return true;
  }
  if (!isSmtpConfigured()) return false;
  try {
    await getTransporter().verify();
    console.log("[mailer] SMTP transporter verified");
    return true;
  } catch (err) {
    console.warn("[mailer] SMTP transporter verification failed (will attempt sending on demand):", err?.message || err);
    return false;
  }
}

async function sendOtpEmail(to, code) {
  return await sendMail({
    to,
    subject: "Your HireHelper verification code",
    html: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:520px;margin:0 auto;padding:28px;border:1px solid #e2e8f0;border-radius:16px;background-color:#ffffff">
      <div style="margin-bottom:24px;padding-bottom:16px;border-bottom:1px solid #f1f5f9">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0">
          <tr>
            <td style="vertical-align:middle;padding-right:10px">
              <div style="background-color:#2563eb;color:#ffffff;width:38px;height:38px;border-radius:10px;text-align:center;line-height:38px;font-weight:800;font-size:20px;display:inline-block">H</div>
            </td>
            <td style="vertical-align:middle">
              <span style="font-size:22px;font-weight:800;color:#0f172a;letter-spacing:-0.5px">HireHelper</span>
            </td>
          </tr>
        </table>
      </div>
      <h2 style="color:#0f172a;margin-top:0;font-size:20px;font-weight:700">Verify your email address</h2>
      <p style="color:#334155;font-size:15px;line-height:1.5">Thank you for joining HireHelper. Please use the verification code below to complete your registration:</p>
      <div style="background:#f8fafc;border:1px dashed #cbd5e1;padding:20px;border-radius:12px;text-align:center;margin:24px 0">
        <span style="font-size:36px;font-weight:800;letter-spacing:8px;color:#2563eb;font-family:monospace">${code}</span>
      </div>
      <p style="color:#64748b;font-size:13px;line-height:1.4">This code will expire in 10 minutes. If you did not create an account on HireHelper, you can safely ignore this email.</p>
      <div style="margin-top:28px;padding-top:16px;border-top:1px solid #f1f5f9;text-align:center;color:#94a3b8;font-size:12px">
        © ${new Date().getFullYear()} HireHelper. All rights reserved.
      </div>
    </div>`,
  });
}

async function sendResetEmail(to, code) {
  return await sendMail({
    to,
    subject: "HireHelper password reset code",
    html: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:520px;margin:0 auto;padding:28px;border:1px solid #e2e8f0;border-radius:16px;background-color:#ffffff">
      <div style="margin-bottom:24px;padding-bottom:16px;border-bottom:1px solid #f1f5f9">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0">
          <tr>
            <td style="vertical-align:middle;padding-right:10px">
              <div style="background-color:#2563eb;color:#ffffff;width:38px;height:38px;border-radius:10px;text-align:center;line-height:38px;font-weight:800;font-size:20px;display:inline-block">H</div>
            </td>
            <td style="vertical-align:middle">
              <span style="font-size:22px;font-weight:800;color:#0f172a;letter-spacing:-0.5px">HireHelper</span>
            </td>
          </tr>
        </table>
      </div>
      <h2 style="color:#0f172a;margin-top:0;font-size:20px;font-weight:700">Reset your password</h2>
      <p style="color:#334155;font-size:15px;line-height:1.5">Use the code below to reset your HireHelper password:</p>
      <div style="background:#f8fafc;border:1px dashed #cbd5e1;padding:20px;border-radius:12px;text-align:center;margin:24px 0">
        <span style="font-size:36px;font-weight:800;letter-spacing:8px;color:#2563eb;font-family:monospace">${code}</span>
      </div>
      <p style="color:#64748b;font-size:13px;line-height:1.4">This code will expire in 10 minutes. If you did not request a password reset, you can safely ignore this email.</p>
      <div style="margin-top:28px;padding-top:16px;border-top:1px solid #f1f5f9;text-align:center;color:#94a3b8;font-size:12px">
        © ${new Date().getFullYear()} HireHelper. All rights reserved.
      </div>
    </div>`,
  });
}

async function sendFeedbackEmail(to, { from, type, subject, message, rating }) {
  return await sendMail({
    to,
    subject: `[HireHelper feedback · ${type}] ${subject}`,
    html: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:520px;margin:0 auto;padding:28px;border:1px solid #e2e8f0;border-radius:16px;background-color:#ffffff">
      <div style="margin-bottom:24px;padding-bottom:16px;border-bottom:1px solid #f1f5f9">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0">
          <tr>
            <td style="vertical-align:middle;padding-right:10px">
              <div style="background-color:#2563eb;color:#ffffff;width:38px;height:38px;border-radius:10px;text-align:center;line-height:38px;font-weight:800;font-size:20px;display:inline-block">H</div>
            </td>
            <td style="vertical-align:middle">
              <span style="font-size:22px;font-weight:800;color:#0f172a;letter-spacing:-0.5px">HireHelper</span>
            </td>
          </tr>
        </table>
      </div>
      <h2 style="margin:0 0 8px;font-size:18px">New ${type} from ${from}</h2>
      <p style="color:#64748b;margin:0 0 12px">Rating: ${rating ? "★".repeat(rating) : "—"}</p>
      <h3 style="margin:12px 0 4px;color:#0f172a">${subject}</h3>
      <pre style="white-space:pre-wrap;font-family:inherit;background:#f8fafc;padding:12px;border-radius:8px;border:1px solid #e2e8f0">${message}</pre>
      <p style="color:#94a3b8;font-size:12px">Open the admin dashboard to reply or resolve.</p>
    </div>`,
  });
}

module.exports = { sendOtpEmail, sendResetEmail, sendFeedbackEmail, verifyTransporter, isSmtpConfigured };