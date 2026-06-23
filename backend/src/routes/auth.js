const router = require("express").Router();
const c = require("../controllers/authController");

router.post("/signup", c.signup);
router.post("/login", c.login);
router.post("/verify-otp", c.verifyOtp);
router.post("/resend-otp", c.resendOtp);

// ~ Forgot / reset password (OTP via email) ~
router.post("/forgot-password", c.forgotPassword);
router.post("/reset-password", c.resetPassword);

module.exports = router;
