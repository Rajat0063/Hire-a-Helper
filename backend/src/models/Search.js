const mongoose = require("mongoose");

// === Search log === — feeds the "Searches" stat + recent activity
const searchSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    query: { type: String, required: true, maxlength: 200 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Search", searchSchema);
