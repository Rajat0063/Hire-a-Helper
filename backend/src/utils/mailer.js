// === Nodemailer & Transactional Email API transport ===
// Reads BREVO_API_KEY, RESEND_API_KEY, or SMTP_* env vars.
// Note: Hosting platforms like Render block outbound SMTP ports (587, 465, 25).
// For reliable email delivery on Render, use BREVO_API_KEY or RESEND_API_KEY.
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

function getBrevoApiKey() {
  for (const [key, val] of Object.entries(process.env)) {
    if (!val || typeof val !== "string") continue;
    const v = val.trim();
    if (!v) continue;
    const k = key.toUpperCase();
    if (
      k === "BREVO_API_KEY" ||
      k === "BREVO_KEY" ||
      k === "BREVO_API" ||
      k === "BREVO_TOKEN" ||
      k === "SIB_API_KEY" ||
      k === "SENDINBLUE_API_KEY" ||
      k.includes("BREVO") ||
      k.includes("SENDINBLUE")
    ) {
      return v;
    }
  }
  return "";
}

function getResendApiKey() {
  for (const [key, val] of Object.entries(process.env)) {
    if (!val || typeof val !== "string") continue;
    const v = val.trim();
    if (!v) continue;
    const k = key.toUpperCase();
    if (k === "RESEND_API_KEY" || k === "RESEND_KEY" || (k.includes("RESEND") && k.includes("KEY"))) {
      return v;
    }
  }
  return "";
}

function isSmtpConfigured() {
  return Boolean(
    getBrevoApiKey() ||
      getResendApiKey() ||
      (process.env.SMTP_USER && process.env.SMTP_PASS)
  );
}

async function sendMail({ to, subject, html }) {
  if (!isSmtpConfigured()) {
    console.warn(`[mailer:WARN] Email service not configured; email to ${to} will be logged to console.`);
    console.log(`[mailer:DEV] -> ${to} | ${subject}\n${html.replace(/<[^>]+>/g, "")}`);
    return { sent: false, smtpConfigured: false, loggedToConsole: true };
  }

  const fromName = process.env.SMTP_FROM_NAME || "HireHelper";
  const rawDefaultSender = process.env.SMTP_USER || process.env.BREVO_SENDER_EMAIL || "rajatyadav5641@gmail.com";
  const cleanDefaultSender = (rawDefaultSender.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/) || ["rajatyadav5641@gmail.com"])[0];
  const fromAddress = process.env.SMTP_FROM || `"${fromName}" <${cleanDefaultSender}>`;

  // 1. Try Brevo API first if key is provided (bypasses Render SMTP port blocking via HTTPS port 443)
  const brevoApiKey = getBrevoApiKey();
  if (brevoApiKey) {
    const rawSenderEmail = process.env.BREVO_SENDER_EMAIL || process.env.SMTP_USER || process.env.SMTP_FROM || cleanDefaultSender;
    const cleanSenderEmail = (rawSenderEmail.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/) || [cleanDefaultSender])[0];

    try {
      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "accept": "application/json",
          "api-key": brevoApiKey,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          sender: { name: fromName, email: cleanSenderEmail },
          to: [{ email: to }],
          subject,
          htmlContent: html,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        console.log(`[mailer:brevo] Email sent successfully to ${to} (messageId: ${data.messageId || data.id})`);
        return { sent: true, provider: "brevo" };
      }
      console.error("[mailer:brevo:ERROR]", data);
    } catch (bErr) {
      console.error("[mailer:brevo:FETCH_ERROR]", bErr?.message || bErr);
    }
  }

  // 2. Try Resend API if key is provided
  const resendApiKey = getResendApiKey();
  if (resendApiKey) {
    const cleanName = (process.env.SMTP_FROM_NAME || "HireHelper").replace(/[^a-zA-Z0-9 ]/g, "").trim() || "HireHelper";
    let resendFrom = process.env.RESEND_FROM
      ? process.env.RESEND_FROM.replace(/^["']|["']$/g, "").trim()
      : `${cleanName} <onboarding@resend.dev>`;

    async function sendViaResend(fromAddr) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromAddr,
          to: [to],
          subject,
          html,
        }),
      });
      const data = await res.json();
      return { ok: res.ok, status: res.status, data };
    }

    try {
      let attempt = await sendViaResend(resendFrom);
      const defaultResendFrom = `${cleanName} <onboarding@resend.dev>`;
      if (!attempt.ok && resendFrom !== defaultResendFrom) {
        console.warn(`[mailer:resend:WARN] Custom 'from' (${resendFrom}) failed (${attempt.status}). Retrying with default: ${defaultResendFrom}`);
        attempt = await sendViaResend(defaultResendFrom);
      }

      if (attempt.ok) {
        console.log(`[mailer:resend] Email sent successfully to ${to} (id: ${attempt.data.id})`);
        return { sent: true, provider: "resend" };
      }
      if (attempt.status === 401) {
        console.error("[mailer:resend:ERROR] 401 Unauthorized - RESEND_API_KEY is invalid or expired. Delete RESEND_API_KEY from Render Environment Variables or replace it with a valid key.");
      } else {
        console.error("[mailer:resend:ERROR]", attempt.data);
      }
    } catch (rErr) {
      console.error("[mailer:resend:FETCH_ERROR]", rErr?.message || rErr);
    }
  }

  // 3. Fall back to Nodemailer SMTP
  const isRender = Boolean(process.env.RENDER || process.env.RENDER_SERVICE_ID || process.env.IS_RENDER);
  if (isRender) {
    console.log(`[mailer:RENDER] Render cloud host detected without BREVO_API_KEY or RESEND_API_KEY. Render blocks outbound SMTP ports 587/465. The code/message was logged above in server logs. To send emails to inbox, add BREVO_API_KEY to Render Environment Variables.`);
    return { sent: false, error: "SMTP blocked on Render. Use BREVO_API_KEY for inbox delivery.", loggedToConsole: true };
  }

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
    return { sent: false, error: err?.message || String(err) };
  }
}

async function verifyTransporter() {
  if (getBrevoApiKey()) {
    console.log("[mailer] Using Brevo HTTP API for emails");
    return true;
  }
  if (getResendApiKey()) {
    console.log("[mailer] Using Resend HTTP API for emails");
    return true;
  }
  if (!isSmtpConfigured()) {
    console.log("[mailer] No SMTP, Brevo, or Resend credentials provided; running in console logging mode");
    return false;
  }
  const isRender = Boolean(process.env.RENDER || process.env.RENDER_SERVICE_ID || process.env.IS_RENDER);
  if (isRender) {
    console.log("[mailer] Render cloud host detected. Outbound SMTP ports (587/465) are blocked by Render infrastructure. Add BREVO_API_KEY in Render Environment Variables for inbox email delivery. OTP codes are logged to server logs.");
    return false;
  }
  try {
    await getTransporter().verify();
    console.log("[mailer] SMTP transporter verified");
    return true;
  } catch (err) {
    console.warn("[mailer] SMTP verification failed. Will attempt sending on demand or log to console:", err?.message || err);
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
  console.log(`\n==================================================`);
  console.log(` [PASSWORD RESET CODE FOR ${to}]: ${code}`);
  console.log(`==================================================\n`);
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



