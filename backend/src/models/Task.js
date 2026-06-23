const mongoose = require("mongoose");

// === Task schema ===
// `image` is a base64 data URL (uploaded via drag & drop on the Add Task page)
// or a remote URL. `paymentAmount` + `currency` power the price chip in the feed.
const taskSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    location: { type: String, required: true },
    category: {
      type: String,
      enum: [
        "Moving", "Cleaning", "Gardening", "Painting", "Repairs",
        "Tech", "Tutoring", "Delivery", "Car Repairing", "Pet Care",
        "Cooking", "Other",
      ],
      default: "Other",
    },
    startTime: { type: Date, required: true },
    endTime: { type: Date },
    status: { type: String, enum: ["open", "in_progress", "completed", "cancelled"], default: "open" },
    paymentAmount: { type: Number, default: 0 },
    currency: { type: String, default: "USD" },

    // ~ Image (base64 data URL or http URL) ~
    image: { type: String, default: "" },
    // ! Legacy field kept for backward compatibility with old docs
    picture: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", taskSchema);
