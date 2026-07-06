const mongoose = require("mongoose");

// !! Every message exchanged between a user and the in-app AI Assistant is
// persisted so the conversation survives page reloads / device switches and
// so admins can improve the rule set later. `role` follows the OpenAI shape
// even though the responses are rule-based today — keeps future model swap
// trivial.
const assistantMessageSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    role: { type: String, enum: ["user", "assistant"], required: true },
    text: { type: String, required: true },
    matchedIntent: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AssistantMessage", assistantMessageSchema);
