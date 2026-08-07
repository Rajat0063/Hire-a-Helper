const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, default: "" },
    phoneVerified: { type: Boolean, default: false },
    password: { type: String, required: true },
    role: { type: String, enum: ["user", "helper", "admin"], default: "user" },
    profilePicture: { type: String, default: "" },
    coverImage: { type: String, default: "" },
    bio: { type: String, default: "" },
    address: { type: String, default: "" },
    dateOfBirth: { type: Date },
    isVerified: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
    stats: {
      totalActions: { type: Number, default: 0 },
      searches: { type: Number, default: 0 },
      logins: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.compare = function (plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model("User", userSchema);