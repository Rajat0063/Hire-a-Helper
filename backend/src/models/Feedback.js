const mongoose = require("mongoose");

// !! User feedback / complaints / suggestions — read from the admin
// dashboard. Kept intentionally small; large replies live in adminNote.
const feedbackSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: ["bug", "suggestion", "complaint", "praise", "other"], default: "other" },
    subject: { type: String, required: true, trim: true, maxlength: 140 },
    message: { type: String, required: true, trim: true, maxlength: 4000 },
    rating: { type: Number, min: 1, max: 5, default: null },
    status: { type: String, enum: ["new", "seen", "resolved"], default: "new" },
    adminNote: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Feedback", feedbackSchema);
