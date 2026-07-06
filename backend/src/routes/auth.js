const router = require("express").Router();
const { auth } = require("../middleware/auth");
const c = require("../controllers/authController");

router.post("/signup", c.signup);
router.post("/login", c.login);
router.post("/verify-otp", c.verifyOtp);
router.post("/resend-otp", c.resendOtp);

router.post("/forgot-password", c.forgotPassword);
router.post("/reset-password", c.resetPassword);
router.patch("/change-password", auth, c.changePassword);

// ~ phone OTP (authenticated) ~
router.post("/phone/send-otp", auth, c.sendPhoneOtp);
router.post("/phone/verify-otp", auth, c.verifyPhoneOtp);

module.exports = router;
