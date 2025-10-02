const express = require('express');
const router = express.Router();

// 1. Import the new 'resetPassword' function from the controller
const { 
    registerUser, 
    loginUser, 
    verifyOtp, 
    forgotPassword,
    resetPassword,
    updateUserProfile
} = require('../controllers/authController');
// PATCH: Update user profile (name, image, phoneNumber). Email cannot be changed.
const { protect } = require('../middleware/authMiddleware');
router.patch('/profile', protect, updateUserProfile);

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/verify-otp', verifyOtp);
router.post('/forgot-password', forgotPassword);

// 2. Add the new route for resetting the password with the token
router.post('/reset-password/:token', resetPassword); // Added this line

module.exports = router;