const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Pending users are temporary and auto-expire after 10 minutes
const pendingUserSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, default: "" },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: 600 },
  },
  { timestamps: true }
);

pendingUserSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

module.exports = mongoose.model("PendingUser", pendingUserSchema);