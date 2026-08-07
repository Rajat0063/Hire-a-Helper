const router = require("express").Router();
const authModule = require("../middleware/auth");
const auth = typeof authModule === "function" ? authModule : (authModule.auth || authModule);
const c = require("../controllers/authController");

router.post("/signup", c.signup);
router.post("/login", c.login);
router.post("/verify-otp", c.verifyOtp);
router.post("/resend-otp", c.resendOtp);

router.post("/forgot-password", c.forgotPassword);
router.post("/reset-password", c.resetPassword);
if (c.changePassword) {
  router.patch("/change-password", auth, c.changePassword);
}

// ~ phone OTP (authenticated) ~
if (c.sendPhoneOtp) router.post("/phone/send-otp", auth, c.sendPhoneOtp);
if (c.verifyPhoneOtp) router.post("/phone/verify-otp", auth, c.verifyPhoneOtp);

module.exports = router;