const User = require('../models/User');
const UserProfileHistory = require('../models/userProfileHistoryModel');
const UserProfile = require('../models/userProfileModel');
const Task = require('../models/taskModel');
/**
 * @desc    Update user profile (name, image, phoneNumber). Email cannot be changed.
 * @route   PATCH /api/auth/profile
 * @access  Private (requires req.user)
 */
const updateUserProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        const { name, image, phoneNumber } = req.body;

        // Find user
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Only allow updating name, image, phoneNumber
        // Log name change only if changed
        if (typeof name === 'string' && name.trim() && name.trim() !== user.name) {
            await UserProfileHistory.create({
                userId: user._id,
                field: 'name',
                oldValue: user.name || '',
                newValue: name.trim(),
                changedBy: user._id,
                changedAt: new Date(),
                note: `updated from '${user.name || ''}' to '${name.trim()}'`
            });
            user.name = name.trim();
        }
        // Log image change only if changed
        if (typeof image === 'string' && image.trim() && image.trim() !== user.image) {
            await UserProfileHistory.create({
                userId: user._id,
                field: 'image',
                oldValue: user.image || '',
                newValue: image.trim(),
                changedBy: user._id,
                changedAt: new Date(),
                note: `updated from '${user.image || ''}' to '${image.trim()}'`
            });
            user.image = image.trim();
        }
        // Log phone number change only if changed
        if (typeof phoneNumber === 'string' && phoneNumber !== user.phoneNumber) {
            await UserProfileHistory.create({
                userId: user._id,
                field: 'phoneNumber',
                oldValue: user.phoneNumber || '',
                newValue: phoneNumber,
                changedBy: user._id,
                changedAt: new Date(),
                note: `updated from '${user.phoneNumber || ''}' to '${phoneNumber}'`
            });
            user.phoneNumber = phoneNumber;
        }

        // Never allow email change
        if (req.body.email && req.body.email !== user.email) {
            return res.status(400).json({ message: 'Email cannot be changed.' });
        }

        await user.save();

        // Upsert user profile in userprofiles collection by userId
            // Always upsert user profile in userprofiles collection with latest data
            await UserProfile.findOneAndUpdate(
                { userId: user._id },
                {
                    userId: user._id,
                    name: user.name,
                    email: user.email,
                    image: user.image,
                    phoneNumber: user.phoneNumber,
                    updatedAt: new Date()
                },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );

        // Update all tasks posted by this user (by userId) with new name/image
        await Task.updateMany(
            { $or: [ { postedByName: user.name }, { userId: user._id } ] },
            { $set: { userImageUrl: user.image, postedByName: user.name } }
        );

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            image: user.image,
            phoneNumber: user.phoneNumber,
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto'); // Added for generating secure tokens

// Helper function to generate a JSON Web Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });
};

/**
 * @desc    Register a new user, send OTP
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerUser = async (req, res) => {
    const { name, email, password, phoneNumber } = req.body;

    try {
        let user = await User.findOne({ email });

        // Case 1: User exists but is not verified
        if (user && !user.isVerified) {
            // Generate and save a new OTP
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            user.otp = otp;
            user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes from now
            await user.save();

            // Resend OTP email
            const message = `Welcome back! Your new One-Time Password (OTP) for Hire-a-Helper is: ${otp}`;
            await sendEmail({ email: user.email, subject: 'Your New Verification Code', message });

            return res.status(200).json({ success: true, message: `A new OTP has been sent to ${user.email}.` });
        }

        // Case 2: User exists and is already verified
        if (user && user.isVerified) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        // Case 3: User does not exist, send OTP first, then create user only if email sent
        const userImage = `https://placehold.co/100x100/52525b/ffffff?text=${name.charAt(0).toUpperCase()}`;
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = Date.now() + 10 * 60 * 1000; // OTP expires in 10 minutes
        const message = `Your One-Time Password (OTP) for Hire-a-Helper is: ${otp}\nThis code will expire in 10 minutes.`;

        // Try to send the OTP email first
        await sendEmail({
            email,
            subject: 'Your Verification Code',
            message,
        });

        // Only create the user if email sent successfully
        user = await User.create({
            name,
            email,
            password,
            phoneNumber,
            image: userImage,
            otp,
            otpExpires
        });

        res.status(201).json({ 
            success: true, 
            message: `An OTP has been sent to ${email}. Please verify to continue.` 
        });

    } catch (error) {
        console.error("Registration Error:", error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

/**
 * @desc    Verify user's OTP and log them in
 * @route   POST /api/auth/verify-otp
 * @access  Public
 */
const verifyOtp = async (req, res) => {
    const { email, otp } = req.body;

    try {
        // Find the user with a matching, unexpired OTP
        const user = await User.findOne({ 
            email, 
            otp,
            otpExpires: { $gt: Date.now() } // Check if OTP is not expired
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid OTP or OTP has expired.' });
        }

        // OTP is correct, so update the user to be verified
        user.isVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        // OTP verified successfully, now log the user in by sending their data and a token
        res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            image: user.image,
            token: generateToken(user._id),
        });

    } catch (error) {
        console.error("OTP Verification Error:", error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check if the user has verified their email
        if (!user.isVerified) {
            return res.status(401).json({ message: 'Account not verified. Please check your email for the OTP.' });
        }
        
        // Check if the password matches
        if (await user.matchPassword(password)) {
            // Password is correct, send user data and token
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                image: user.image,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

/**
 * @desc    Handle forgot password request
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = async (req, res) => {
    const { email } = req.body;
    let user; // Define user here to be accessible in the catch block

    try {
        user = await User.findOne({ email });

        if (!user) {
            return res.status(200).json({ message: 'If an account with that email exists, a reset link has been sent.' });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');

        user.passwordResetToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');
            
        user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
        
        await user.save();

        const resetURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

        const message = `You requested a password reset. Click this link to reset your password:\n\n${resetURL}\n\nThis link will expire in 10 minutes. If you did not make this request, please ignore this email.`;
        
        await sendEmail({
            email: user.email,
            subject: 'Your Password Reset Link',
            message,
        });

        res.status(200).json({ message: 'If an account with that email exists, a reset link has been sent.' });

    } catch (error) {
        console.error("FORGOT PASSWORD ERROR:", error); // Improved logging

        // Corrected error handling logic
        if (user) {
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;
            await user.save();
        }
        
        res.status(500).json({ message: 'An error occurred while sending the email. Please try again.' });
    }
};

// --- NEW FUNCTION ADDED ---
/**
 * @desc    Reset password using token
 * @route   POST /api/auth/reset-password/:token
 * @access  Public
 */
const resetPassword = async (req, res) => {
    try {
        // Get the plain token from the URL and hash it for database comparison
        const resetToken = req.params.token;
        const hashedToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');

        // Find the user by the hashed token and check if it has not expired
        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() }, // Check expiry date
        });

        // If token is invalid or expired, send an error
        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired token.' });
        }

        // Set the new password from the request body
        user.password = req.body.password;
        
        // Invalidate the token so it can't be used again
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;

        // The pre-save hook in your User model will automatically hash the new password
        await user.save();

        res.status(200).json({ message: 'Your password has been reset successfully.' });

    } catch (error) {
        console.error("RESET PASSWORD ERROR:", error);
        res.status(500).json({ message: 'An internal server error occurred.' });
    }
};

// --- EXPORTS UPDATED ---
// Update the exports to include all auth functions
module.exports = { registerUser, verifyOtp, loginUser, forgotPassword, resetPassword, updateUserProfile };