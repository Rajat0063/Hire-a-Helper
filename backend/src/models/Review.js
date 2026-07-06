const mongoose = require("mongoose");

// === Review schema ===
// Left by a task owner for the worker who helped on their task.
const reviewSchema = new mongoose.Schema(
  {
    task: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true },
    fromUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // owner
    toUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },   // worker
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, default: "", maxlength: 1000 },
  },
  { timestamps: true }
);

reviewSchema.index({ task: 1, fromUser: 1, toUser: 1 }, { unique: true });

module.exports = mongoose.model("Review", reviewSchema);
