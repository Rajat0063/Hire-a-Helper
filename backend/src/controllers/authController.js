const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Otp = require("../models/Otp");
const { sendOtpEmail, sendResetEmail } = require("../utils/mailer");

const sign = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES || "7d" });

const genOtp = () => String(Math.floor(100000 + Math.random() * 900000));

// === POST /api/auth/signup ===
// Rejects duplicate emails with HTTP 409 so the frontend can show
// "this account already exists" instead of silently failing.
exports.signup = async (req, res) => {
  const { firstName, lastName, email, phone, password } = req.body;
  if (await User.findOne({ email }))
    return res.status(409).json({ message: "An account with this email already exists. Please sign in instead." });

  const user = await User.create({ firstName, lastName, email, phone, password });
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

  if (!user.isVerified) {
    const code = genOtp();
    await Otp.deleteMany({ email });
    await Otp.create({ email, code });
    await sendOtpEmail(email, code);
    return res.status(200).json({ requireOtp: true, email });
  }

  // ~ bump login analytics on every successful login ~
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
// ! Always responds 200 to avoid leaking which emails are registered.
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
// Verifies the OTP issued by forgot-password and replaces the password.
exports.resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword || newPassword.length < 6)
    return res.status(400).json({ message: "Invalid request" });

  const found = await Otp.findOne({ email, code: otp });
  if (!found) return res.status(400).json({ message: "Invalid or expired code" });

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: "User not found" });

  user.password = newPassword; // pre-save hook re-hashes
  await user.save();
  await Otp.deleteMany({ email });

  res.json({ message: "Password reset successfully. You can now sign in." });
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
    role: u.role,
    profilePicture: u.profilePicture,
    coverImage: u.coverImage,
    bio: u.bio,
    address: u.address,
    dateOfBirth: u.dateOfBirth,
    isVerified: u.isVerified,
    stats: u.stats || { totalActions: 0, searches: 0, logins: 0 },
    createdAt: u.createdAt,
  };
}
exports.stripUser = stripUser;
exports.sign = sign;
