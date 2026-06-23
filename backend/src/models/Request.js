const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema(
  {
    task: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true },
    requester: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["pending", "accepted", "rejected", "completed"], default: "pending" },
  },
  { timestamps: true }
);

requestSchema.index({ task: 1, requester: 1 }, { unique: true });

module.exports = mongoose.model("Request", requestSchema);
