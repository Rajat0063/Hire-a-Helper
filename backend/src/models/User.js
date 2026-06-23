const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// === User schema ===
// All profile data lives here. Profile/cover images stored as base64 data URLs
// (kept simple: no external object storage). Extend by adding new fields below.
const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, default: "" },
    password: { type: String, required: true },

    // ~ Profile media (base64 data URLs OR remote https URLs) ~
    profilePicture: { type: String, default: "" },
    coverImage: { type: String, default: "" },

    // ~ Extra profile info shown on overview / public profile ~
    bio: { type: String, default: "", maxlength: 500 },
    address: { type: String, default: "" },
    dateOfBirth: { type: Date },

    role: { type: String, enum: ["user", "admin"], default: "user" },
    isVerified: { type: Boolean, default: false },

    // ~ Lightweight per-user analytics shown on the Overview dashboard ~
    stats: {
      totalActions: { type: Number, default: 0 },
      searches: { type: Number, default: 0 },
      logins: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.compare = function (plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model("User", userSchema);
