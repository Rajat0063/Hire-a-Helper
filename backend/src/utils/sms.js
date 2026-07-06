// === SMS helper ===
// Uses Twilio Verify when TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN +
// TWILIO_VERIFY_SID are set; otherwise falls back to console-logged dev
// code. This way local development works without any paid SMS provider,
// but production just needs three env vars added.
let twilioClient = null;
function getTwilio() {
  if (twilioClient !== null) return twilioClient;
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const tok = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !tok) return (twilioClient = false);
  try {
    // eslint-disable-next-line global-require
    const twilio = require("twilio");
    twilioClient = twilio(sid, tok);
    return twilioClient;
  } catch {
    return (twilioClient = false);
  }
}

exports.isReal = () =>
  !!(getTwilio() && process.env.TWILIO_VERIFY_SID);

// Send a verification code to a phone number using Twilio Verify.
// Returns { real: true } when Twilio handled it, { real: false, code } when
// we fell back to a local dev code (caller stores+logs it).
exports.sendVerification = async (phone, devCode) => {
  const c = getTwilio();
  if (c && process.env.TWILIO_VERIFY_SID) {
    await c.verify.v2
      .services(process.env.TWILIO_VERIFY_SID)
      .verifications.create({ to: phone, channel: "sms" });
    return { real: true };
  }
  console.log(`[phone-otp:dev] ${phone} -> ${devCode}`);
  return { real: false, code: devCode };
};

// Returns true when the code is accepted, false otherwise.
exports.checkVerification = async (phone, code, expectedDevCode) => {
  const c = getTwilio();
  if (c && process.env.TWILIO_VERIFY_SID) {
    const r = await c.verify.v2
      .services(process.env.TWILIO_VERIFY_SID)
      .verificationChecks.create({ to: phone, code });
    return r.status === "approved";
  }
  return code && expectedDevCode && code === expectedDevCode;
};
