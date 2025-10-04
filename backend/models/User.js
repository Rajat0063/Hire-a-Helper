const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a name'],
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'Please provide a valid email',
        ],
    },
    phoneNumber: {
        type: String,
        required: false, // Optional field
    },
    // --- ADDED: Field for user's profile image URL ---
    image: {
        type: String,
        required: false,
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 6,
        select: false, // Don't send password back in queries by default
    },
    // --- ADMIN ROLE FIELD ---
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
    },
    // --- BLOCKED FIELD ---
    blocked: {
        type: Boolean,
        default: false,
    },
    // --- FIELDS FOR OTP VERIFICATION ---
    isVerified: {
        type: Boolean,
        default: false,
    },
    otp: {
        type: String,
        required: false,
    },
    otpExpires: {
        type: Date,
        required: false,
    },
    // --- FIELDS FOR PASSWORD RESET (Added) ---
    passwordResetToken: {
        type: String,
    },
    passwordResetExpires: {
        type: Date,
    },
}, {
    timestamps: true, // Adds createdAt and updatedAt fields
});

// Middleware to hash password before saving the user document
userSchema.pre('save', async function (next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Method to compare entered password with the hashed password in the database
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Create and export the User model
const User = mongoose.model('User', userSchema);
module.exports = User;