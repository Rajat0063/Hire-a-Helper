const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const pendingUserSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, default: "" },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: 3600 },
  },
  { timestamps: true }
);

pendingUserSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

module.exports = mongoose.model("PendingUser", pendingUserSchema);