const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: ["message", "request", "payment", "task", "system", "feedback", "review"],
      default: "system",
      index: true,
    },
    title: { type: String, default: "" },
    body: { type: String, required: true },
    link: { type: String, default: "" },
    read: { type: Boolean, default: false, index: true },
    category: { type: String, default: "all" },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);

