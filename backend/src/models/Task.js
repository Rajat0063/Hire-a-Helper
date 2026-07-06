const mongoose = require("mongoose");

// === Task schema ===
// lat/lng power the "Nearby Tasks" page (haversine query in taskController.nearby)
const taskSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    location: { type: String, required: true },
    // ~ optional geo coords (used by /api/tasks/nearby) ~
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },

    // Admin-managed categories are stored in Settings, so this must stay open.
    category: { type: String, default: "Other", trim: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date },
    status: { type: String, enum: ["open", "in_progress", "completed", "cancelled"], default: "open" },
    paymentAmount: { type: Number, default: 0 },
    currency: { type: String, default: "INR" },

    image: { type: String, required: true },
    picture: { type: String, default: "" }, // !legacy
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", taskSchema);
