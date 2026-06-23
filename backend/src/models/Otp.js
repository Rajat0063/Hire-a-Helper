const mongoose = require("mongoose");

// !! OTP doc — auto-expires after 10 minutes via TTL index
const otpSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true },
  code: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 600 },
});

module.exports = mongoose.model("Otp", otpSchema);
