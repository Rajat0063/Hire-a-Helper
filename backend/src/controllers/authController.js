const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Otp = require("../models/Otp");
const Settings = require("../models/Settings");
const { sendOtpEmail, sendResetEmail } = require("../utils/mailer");
const sms = require("../utils/sms");

const sign = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES || "7d" });

const genOtp = () => String(Math.floor(100000 + Math.random() * 900000));

// === POST /api/auth/signup ===
exports.signup = async (req, res) => {
  const { firstName, lastName, email, phone, password } = req.body;
  const settings = await Settings.findOne({ key: "platform" });
  if (settings && settings.enableRegistrations === false) {
    return res.status(403).json({ code: "REGISTRATION_DISABLED", message: "New registrations are currently disabled." });
  }
  const existing = await User.findOne({ email });
  if (existing) {
    // !! Distinguish blocked vs already-exists so the UI can show the right alert
    if (existing.isBlocked)
      return res.status(403).json({ code: "USER_BLOCKED",
        message: "This email is blocked by an administrator and cannot be used." });
    return res.status(409).json({ code: "EMAIL_EXISTS",
      message: "An account with this email already exists. Please sign in instead." });
  }

  const requireEmailVerification = settings?.requireEmailVerification !== false;
  const user = await User.create({ firstName, lastName, email, phone, password, isVerified: !requireEmailVerification });
  if (!requireEmailVerification) {
    return res.status(201).json({ token: sign(user._id), user: stripUser(user), message: "Signup successful." });
  }
  const code = genOtp();
  await Otp.create({ email: user.email, code });
  await sendOtpEmail(user.email, code);
  res.status(201).json({ message: "Signup successful. OTP sent to email.", email: user.email });
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
    await sendOtpEmail(email, code);
    return res.status(200).json({ requireOtp: true, email });
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
  const user = await User.findOneAndUpdate({ email }, { isVerified: true }, { new: true });
  res.json({ token: sign(user._id), user: stripUser(user) });
};

// === POST /api/auth/resend-otp ===
exports.resendOtp = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: "User not found" });
  const code = genOtp();
  await Otp.deleteMany({ email });
  await Otp.create({ email, code });
  await sendOtpEmail(email, code);
  res.json({ message: "OTP resent" });
};

// === POST /api/auth/forgot-password ===
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (user) {
    const code = genOtp();
    await Otp.deleteMany({ email });
    await Otp.create({ email, code });
    await sendResetEmail(email, code);
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
