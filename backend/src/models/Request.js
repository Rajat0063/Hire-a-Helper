const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema(
  {
    task: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true },
    requester: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "in_progress", "completed", "cancelled"],
      default: "pending",
    },
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", default: null },

    // === Worker geolocation check-in (when moving to in_progress) ===
    workerLat: { type: Number, default: null },
    workerLng: { type: Number, default: null },
    checkinAt: { type: Date, default: null },
    offSite: { type: Boolean, default: false },
    distanceKm: { type: Number, default: null },
    completedAt: { type: Date, default: null },

    // === Razorpay payment ===
    paymentStatus: { type: String, enum: ["unpaid", "processing", "paid", "failed"], default: "unpaid" },
    razorpayOrderId: { type: String, default: "" },
    razorpayPaymentId: { type: String, default: "" },
    paidAt: { type: Date, default: null },
  },
  { timestamps: true }
);

requestSchema.index({ task: 1, requester: 1 }, { unique: true });

module.exports = mongoose.model("Request", requestSchema);
