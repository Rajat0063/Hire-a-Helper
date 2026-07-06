const mongoose = require("mongoose");

// === Conversation ===
// Created automatically when a request is accepted (see requestController.update).
// Participants are exactly [taskOwner, requester].
const conversationSchema = new mongoose.Schema(
  {
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }],
    task: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
    request: { type: mongoose.Schema.Types.ObjectId, ref: "Request" },
    lastMessage: { type: String, default: "" },
    lastAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

conversationSchema.index({ participants: 1, task: 1 });

module.exports = mongoose.model("Conversation", conversationSchema);
