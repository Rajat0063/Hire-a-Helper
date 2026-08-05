const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Otp = require("../models/Otp");
const PendingUser = require("../models/PendingUser");
const Settings = require("../models/Settings");
const { sendOtpEmail, sendResetEmail } = require("../utils/mailer");
const sms = require("../utils/sms");

const sign = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES || "7d" });

const genOtp = () => String(Math.floor(100000 + Math.random() * 900000));

// === POST /api/auth/signup ===
exports.signup = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password } = req.body;
    const settings = await Settings.findOne({ key: "platform" });
    if (settings && settings.enableRegistrations === false) {
      return res.status(403).json({ code: "REGISTRATION_DISABLED", message: "New registrations are currently disabled." });
    }
    const existing = await User.findOne({ email });
    if (existing) {
      try {
        console.warn(`[signup] email conflict - received=${String(email).slice(0,200)} existingId=${existing._id} createdAt=${existing.createdAt}`);
      } catch (logErr) { /* ignore logging failures */ }
      if (existing.isBlocked)
        return res.status(403).json({ code: "USER_BLOCKED",
          message: "This email is blocked by an administrator and cannot be used." });
      return res.status(409).json({ code: "EMAIL_EXISTS",
        message: "An account with this email already exists. Please sign in instead." });
    }

    const requireEmailVerification = settings?.requireEmailVerification !== false;
    if (!requireEmailVerification) {
      const user = await User.create({ firstName, lastName, email, phone, password, isVerified: true });
      return res.status(201).json({ token: sign(user._id), user: stripUser(user), message: "Signup successful." });
    }

    // When email verification is required, do NOT create the real User yet.
    // Store the signup data in PendingUser (auto-expires) and send an OTP.
    const existingPending = await PendingUser.findOne({ email });
    if (existingPending) {
      existingPending.firstName = firstName;
      existingPending.lastName = lastName;
      existingPending.phone = phone;
      existingPending.password = password;
      await existingPending.save();
    } else {
      await PendingUser.create({ firstName, lastName, email, phone, password });
    }

    const code = genOtp();
    await Otp.deleteMany({ email });
    await Otp.create({ email, code });

    try {
      const mailResult = await sendOtpEmail(email, code);
      if (mailResult?.devMode && process.env.NODE_ENV !== "production") {
        return res.status(201).json({
          message: "Signup received. OTP sent to email.",
          email,
          devCode: code,
        });
      }
      return res.status(201).json({ message: "Signup received. OTP sent to email.", email });
    } catch (mailErr) {
      console.error("[signup:mail]", mailErr && (mailErr.stack || mailErr.message || mailErr));
      return res.status(503).json({
        message: "Unable to send verification email right now. Please try again in a moment.",
      });
    }
  } catch (err) {
    console.error("[signup:error]", err && (err.stack || err.message || err));
    return res.status(500).json({ message: err?.message || "Server error" });
  }
};

// === POST /api/auth/login ===
exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await user.compare(password)))
    return res.status(401).json({ message: "Invalid email or password" });

  if (user.isBlocked)
    return res.status(403).json({ code: "USER_BLOCKED",
      message: "Your account has been blocked by an administrator. Please contact support." });

  if (!user.isVerified) {
    const code = genOtp();
    await Otp.deleteMany({ email });
    await Otp.create({ email, code });

    try {
      const mailResult = await sendOtpEmail(email, code);
      if (mailResult?.devMode && process.env.NODE_ENV !== "production") {
        return res.status(200).json({ requireOtp: true, email, devCode: code });
      }
      return res.status(200).json({ requireOtp: true, email });
    } catch (mailErr) {
      console.error("[login:mail]", mailErr && (mailErr.stack || mailErr.message || mailErr));
      return res.status(503).json({
        message: "Unable to send verification email right now. Please try again in a moment.",
      });
    }
  }

  user.stats = user.stats || {};
  user.stats.logins = (user.stats.logins || 0) + 1;
  user.stats.totalActions = (user.stats.totalActions || 0) + 1;
  await user.save();

  res.json({ token: sign(user._id), user: stripUser(user) });
};

// === POST /api/auth/verify-otp ===
exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  const found = await Otp.findOne({ email, code: otp });
  if (!found) return res.status(400).json({ message: "Invalid or expired OTP" });
  await Otp.deleteMany({ email });
  // If a pending signup exists, create the real user now.
  const pending = await PendingUser.findOne({ email });
  let user;
  if (pending) {
    user = await User.create({
      firstName: pending.firstName,
      lastName: pending.lastName,
      email: pending.email,
      phone: pending.phone,
      password: pending.password,
      isVerified: true,
    });
    await PendingUser.deleteMany({ email });
  } else {
    user = await User.findOneAndUpdate({ email }, { isVerified: true }, { new: true });
  }
  res.json({ token: sign(user._id), user: stripUser(user) });
};

// === POST /api/auth/resend-otp ===
exports.resendOtp = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  const pending = await PendingUser.findOne({ email });
  if (!user && !pending) return res.status(404).json({ message: "User not found" });
  const code = genOtp();
  await Otp.deleteMany({ email });
  await Otp.create({ email, code });

  try {
    const mailResult = await sendOtpEmail(email, code);
    if (mailResult?.devMode && process.env.NODE_ENV !== "production") {
      return res.json({ message: "OTP resent", devCode: code });
    }
    res.json({ message: "OTP resent" });
  } catch (mailErr) {
    console.error("[resendOtp:mail]", mailErr && (mailErr.stack || mailErr.message || mailErr));
    res.status(503).json({ message: "Unable to resend verification email right now. Please try again in a moment." });
  }
};

// === POST /api/auth/forgot-password ===
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (user) {
    const code = genOtp();
    await Otp.deleteMany({ email });
    await Otp.create({ email, code });

    try {
      const mailResult = await sendResetEmail(email, code);
      if (mailResult?.devMode && process.env.NODE_ENV !== "production") {
        return res.json({ message: "If an account exists for that email, a reset code has been sent.", devCode: code });
      }
    } catch (mailErr) {
      console.error("[forgotPassword:mail]", mailErr && (mailErr.stack || mailErr.message || mailErr));
      return res.status(503).json({ message: "Unable to send the reset email right now. Please try again in a moment." });
    }
  }
  res.json({ message: "If an account exists for that email, a reset code has been sent." });
};

// === POST /api/auth/reset-password ===
exports.resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword || newPassword.length < 6)
    return res.status(400).json({ message: "Invalid request" });

  const found = await Otp.findOne({ email, code: otp });
  if (!found) return res.status(400).json({ message: "Invalid or expired code" });

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: "User not found" });

  user.password = newPassword;
  await user.save();
  await Otp.deleteMany({ email });

  res.json({ message: "Password reset successfully. You can now sign in." });
};

// === PATCH /api/auth/change-password ===
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword || newPassword.length < 6)
    return res.status(400).json({ message: "Enter your current password and a new password with at least 6 characters." });

  const user = await User.findById(req.user._id);
  if (!user || !(await user.compare(currentPassword)))
    return res.status(400).json({ message: "Current password is incorrect" });

  user.password = newPassword;
  await user.save();
  res.json({ message: "Password changed successfully" });
};

// === POST /api/auth/phone/send-otp  (authenticated) ===
// Uses Twilio Verify when TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN/TWILIO_VERIFY_SID
// are set — a real SMS goes to the user's handset. Without those vars we
// fall back to a dev OTP (returned + console-logged) for friction-free local dev.
exports.sendPhoneOtp = async (req, res) => {
  const { phone } = req.body;
  if (!phone || phone.length < 7) return res.status(400).json({ message: "Enter a valid phone number" });

  const devCode = genOtp();
  const result = await sms.sendVerification(phone, devCode);

  const key = `phone:${phone}`;
  await Otp.deleteMany({ email: key });
  // sentinel "twilio" means verification is checked remotely on /verify
  await Otp.create({ email: key, code: result.real ? "twilio" : devCode });

  await User.updateOne({ _id: req.user._id }, { phone, phoneVerified: false });

  res.json({
    message: result.real
      ? "Verification code sent to your phone."
      : "OTP sent (dev mode — Twilio not configured).",
    real: result.real,
    devCode: result.real || process.env.NODE_ENV === "production" ? undefined : devCode,
  });
};

// === POST /api/auth/phone/verify-otp (authenticated) ===
exports.verifyPhoneOtp = async (req, res) => {
  const { phone, otp } = req.body;
  const key = `phone:${phone}`;
  const stored = await Otp.findOne({ email: key });
  if (!stored) return res.status(400).json({ message: "Code expired — please resend" });

  const ok = stored.code === "twilio"
    ? await sms.checkVerification(phone, otp)
    : stored.code === otp;
  if (!ok) return res.status(400).json({ message: "Invalid or expired code" });

  await Otp.deleteMany({ email: key });
  const u = await User.findByIdAndUpdate(
    req.user._id,
    { phone, phoneVerified: true },
    { new: true }
  ).select("-password");
  res.json({ user: stripUser(u) });
};

// === GET /api/users/me ===
exports.me = async (req, res) => res.json({ user: stripUser(req.user) });

function stripUser(u) {
  return {
    id: u._id,
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    phone: u.phone,
    phoneVerified: u.phoneVerified,
    role: u.role,
    profilePicture: u.profilePicture,
    coverImage: u.coverImage,
    bio: u.bio,
    address: u.address,
    dateOfBirth: u.dateOfBirth,
    isVerified: u.isVerified,
    isBlocked: u.isBlocked,
    stats: u.stats || { totalActions: 0, searches: 0, logins: 0 },
    createdAt: u.createdAt,
  };
}
exports.stripUser = stripUser;
exports.sign = sign;
