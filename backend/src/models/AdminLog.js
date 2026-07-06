const mongoose = require("mongoose");

// === AdminLog ===
// Persistent audit trail for every privileged action performed via the
// admin panel. Written by adminController wrappers.
const adminLogSchema = new mongoose.Schema(
  {
    admin: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true }, // e.g. "user.block"
    targetType: { type: String, default: "" }, // "user" | "task" | "settings" | "category"
    targetId: { type: String, default: "" },
    meta: { type: Object, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AdminLog", adminLogSchema);
