const mongoose = require("mongoose");

// === UserBlock ===
// User-to-user personal block (chat/visibility). Independent from the
// admin-level `User.isBlocked` account block.
const userBlockSchema = new mongoose.Schema(
  {
    blocker: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    blocked: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);
userBlockSchema.index({ blocker: 1, blocked: 1 }, { unique: true });

module.exports = mongoose.model("UserBlock", userBlockSchema);
