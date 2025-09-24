const express = require('express');
const router = express.Router();

// 1. Import the new 'resetPassword' function from the controller
const { 
    registerUser, 
    loginUser, 
    verifyOtp, 
    forgotPassword,
    resetPassword // Added this line
} = require('../controllers/authController');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/verify-otp', verifyOtp);
router.post('/forgot-password', forgotPassword);

// 2. Add the new route for resetting the password with the token
router.post('/reset-password/:token', resetPassword); // Added this line

module.exports = router;