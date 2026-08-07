const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const PendingUser = require("../models/PendingUser");
const Otp = require("../models/Otp");
const sms = require("../utils/sms");
const { sendOtpEmail, sendResetEmail } = require("../utils/mailer");

function genOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function genToken(user) {
  const secret = process.env.JWT_SECRET || "devsecret";
  return jwt.sign({ id: user._id || user.id }, secret, { expiresIn: "7d" });
}

// === POST /api/auth/signup ===
exports.signup = async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone, role } = req.body;
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Upsert into PendingUser
    await PendingUser.deleteMany({ email });
    await PendingUser.create({
      firstName,
      lastName,
      email,
      password,
      phone: phone || "",
      role: role || "user",
    });

    const code = genOtp();
    await Otp.deleteMany({ email });
    await Otp.create({ email, code });
    
    // Send email to user's address
    sendOtpEmail(email, code).catch((e) => console.error("[signup:mail]", e && (e.stack || e.message || e)));

    return res.status(201).json({
      message: "Signup received. Verification code sent to your email.",
      email,
    });
  } catch (err) {
    console.error("[signup:error]", err && (err.stack || err.message || err));
    return res.status(500).json({ message: "Signup failed on server" });
  }
};

// === POST /api/auth/login ===
exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: "Invalid credentials" });

  const match = await user.compare(password);
  if (!match) return res.status(400).json({ message: "Invalid credentials" });

  if (user.isBlocked) {
    return res.status(403).json({ message: "Account is suspended. Contact support." });
  }

  // Generate 2FA / Login OTP
  if (!user.isVerified) {
    const code = genOtp();
    await Otp.deleteMany({ email });
    await Otp.create({ email, code });
    sendOtpEmail(email, code).catch((e) => console.error("[login:mail]", e && (e.stack || e.message || e)));
    return res.status(200).json({
      requireOtp: true,
      email,
    });
  }

  user.stats.logins = (user.stats.logins || 0) + 1;
  await user.save();

  const token = genToken(user);
  res.json({ token, user });
};

// === POST /api/auth/verify-otp ===
exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  const record = await Otp.findOne({ email, code: otp });
  if (!record) return res.status(400).json({ message: "Invalid or expired OTP" });

  await Otp.deleteMany({ email });

  let user = await User.findOne({ email });
  if (!user) {
    const pending = await PendingUser.findOne({ email });
    if (!pending) {
      return res.status(400).json({ message: "Registration expired. Please sign up again." });
    }
    user = await User.create({
      firstName: pending.firstName,
      lastName: pending.lastName,
      email: pending.email,
      password: pending.password,
      phone: pending.phone,
      role: pending.role,
      isVerified: true,
    });
    await PendingUser.deleteMany({ email });
  } else {
    user.isVerified = true;
    await user.save();
  }

  const token = genToken(user);
  res.json({ token, user });
};

// === POST /api/auth/resend-otp ===
exports.resendOtp = async (req, res) => {
  const { email } = req.body;
  const code = genOtp();
  await Otp.deleteMany({ email });
  await Otp.create({ email, code });
  sendOtpEmail(email, code).catch((e) => console.error("[resendOtp:mail]", e && (e.stack || e.message || e)));
  res.json({ message: "Verification code sent to your email." });
};

// === POST /api/auth/forgot-password ===
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (user) {
    const code = genOtp();
    await Otp.deleteMany({ email });
    await Otp.create({ email, code });
    sendResetEmail(email, code).catch((e) => console.error("[forgotPassword:mail]", e && (e.stack || e.message || e)));
  }
  res.json({ message: "If an account exists for that email, a reset code has been sent." });
};

// === POST /api/auth/reset-password ===
exports.resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  const record = await Otp.findOne({ email, code: otp });
  if (!record) return res.status(400).json({ message: "Invalid or expired code" });

  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: "User not found" });

  user.password = newPassword;
  await user.save();
  await Otp.deleteMany({ email });

  res.json({ message: "Password reset successful. Please sign in." });
};

// === GET /api/auth/me ===
exports.me = async (req, res) => {
  res.json({ user: req.user });
};

// === Phone OTP Endpoint ===
exports.sendPhoneOtp = async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ message: "Phone required" });
  const key = `phone:${phone}`;
  await Otp.deleteMany({ email: key });
  const devCode = genOtp();
  const result = await sms.sendVerification(phone, devCode);
  await Otp.create({ email: key, code: result.real ? "twilio" : devCode });
  res.json({
    message: result.real
      ? "Verification code sent to your phone."
      : "Verification code sent to your phone.",
    real: result.real,
  });
};

exports.verifyPhoneOtp = async (req, res) => {
  const { phone, code } = req.body;
  const key = `phone:${phone}`;
  const rec = await Otp.findOne({ email: key });
  if (!rec) return res.status(400).json({ message: "OTP expired or not sent" });
  if (rec.code === "twilio") {
    const ok = await sms.checkVerification(phone, code);
    if (!ok) return res.status(400).json({ message: "Invalid code" });
  } else if (rec.code !== code) {
    return res.status(400).json({ message: "Invalid code" });
  }
  await Otp.deleteMany({ email: key });
  const user = await User.findById(req.user.id);
  user.phone = phone;
  user.phoneVerified = true;
  await user.save();
  res.json({ message: "Phone verified", user });
};