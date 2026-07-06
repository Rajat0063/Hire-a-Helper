const mongoose = require("mongoose");

// === Platform settings ===
// Single document keyed by `key:"platform"` storing admin-tunable values.
const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, default: "platform" },
    enableRegistrations: { type: Boolean, default: true },
    requireEmailVerification: { type: Boolean, default: true },
    allowTaskEditing: { type: Boolean, default: true },
    pushNotifications: { type: Boolean, default: true },
    maintenanceMode: { type: Boolean, default: false },
    categories: {
      type: [String],
      default: [
        "Car Repairing", "Painting", "Moving", "Cleaning", "Gardening", "Car Washing",
        "Plumbing", "Electrical", "Cooking", "Tutoring", "Delivery", "Pet Care",
        "Assembly", "Handyman", "Babysitting", "Elderly Care", "Photography",
        "Event Help", "Grocery Shopping", "Laundry", "Tech Support", "Beauty & Salon",
        "Fitness Trainer", "Music Lessons", "Language Tutor", "Home Repair", "Other",
      ],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Settings", settingsSchema);
