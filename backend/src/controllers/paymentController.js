// === Razorpay payment controller ===
// Flow:
//   1. Worker marks the request "completed" (see requestController.complete).
//   2. Task owner hits POST /api/payments/order to create a Razorpay order.
//   3. Frontend opens Razorpay Checkout. On success it calls
//      POST /api/payments/verify with the razorpay_* payload.
//   4. We HMAC-verify the signature server-side, mark the request "paid",
//      and flip the parent task to "completed".
//
// If RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are missing we fall back to a
// dev-only "simulated" flow so the UI still works end-to-end locally.
const crypto = require("crypto");
const Request = require("../models/Request");
const Task = require("../models/Task");
const Notification = require("../models/Notification");
const { emitToUser } = require("../socket");

let Razorpay;
try { Razorpay = require("razorpay"); } catch { /* optional */ }

const KEY_ID = process.env.RAZORPAY_KEY_ID || "";
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";
const LIVE = !!(KEY_ID && KEY_SECRET && Razorpay);

function client() {
  return new Razorpay({ key_id: KEY_ID, key_secret: KEY_SECRET });
}

// === POST /api/payments/order  { requestId } ===
exports.createOrder = async (req, res) => {
  const r = await Request.findById(req.body.requestId).populate("task");
  if (!r) return res.status(404).json({ message: "Request not found" });
  if (String(r.task.user) !== String(req.user._id))
    return res.status(403).json({ message: "Only the task owner can pay" });
  if (r.status !== "completed")
    return res.status(400).json({ message: "Worker hasn't marked the task complete yet." });
  if (r.paymentStatus === "paid")
    return res.status(400).json({ message: "Already paid." });

  const amount = Math.round(Number(r.task.paymentAmount || 0) * 100); // paise
  if (!amount) return res.status(400).json({ message: "Task has no payment amount set." });

  // Dev fallback — no Razorpay keys configured
  if (!LIVE) {
    const fakeId = "order_dev_" + Date.now();
    r.razorpayOrderId = fakeId;
    r.paymentStatus = "processing";
    await r.save();
    return res.json({
      simulated: true,
      keyId: null,
      order: { id: fakeId, amount, currency: r.task.currency || "INR" },
      request: r,
    });
  }

  const order = await client().orders.create({
    amount, currency: r.task.currency || "INR",
    receipt: `req_${r._id}`,
    notes: { requestId: String(r._id), taskId: String(r.task._id) },
  });
  r.razorpayOrderId = order.id;
  r.paymentStatus = "processing";
  await r.save();
  res.json({ simulated: false, keyId: KEY_ID, order, request: r });
};

// === POST /api/payments/verify ===
// body: { requestId, razorpay_order_id, razorpay_payment_id, razorpay_signature }
exports.verifyPayment = async (req, res) => {
  const { requestId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
  const r = await Request.findById(requestId).populate("task");
  if (!r) return res.status(404).json({ message: "Request not found" });
  if (String(r.task.user) !== String(req.user._id))
    return res.status(403).json({ message: "Forbidden" });

  if (LIVE) {
    const expected = crypto
      .createHmac("sha256", KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");
    if (expected !== razorpay_signature) {
      r.paymentStatus = "failed"; await r.save();
      return res.status(400).json({ message: "Invalid payment signature" });
    }
  }

  r.paymentStatus = "paid";
  r.razorpayPaymentId = razorpay_payment_id || `dev_pay_${Date.now()}`;
  r.paidAt = new Date();
  await r.save();

  // Flip the parent task to completed so completion-rate analytics update.
  await Task.findByIdAndUpdate(r.task._id, { status: "completed" });

  // Notify the worker
  const note = await Notification.create({
    user: r.requester,
    body: `💰 You've been paid for "${r.task.title}".`,
  });
  emitToUser(r.requester, "notification:new", note);
  emitToUser(r.requester, "request:status", { requestId: r._id, status: "completed", paymentStatus: "paid" });
  emitToUser(r.task.user, "request:status", { requestId: r._id, status: "completed", paymentStatus: "paid" });

  res.json({ ok: true, request: r });
};

// === POST /api/payments/simulate  (dev-only manual mark-paid) ===
exports.simulatePaid = async (req, res) => {
  if (LIVE) return res.status(400).json({ message: "Live Razorpay is configured — use verify." });
  req.body.razorpay_payment_id = "dev_pay_" + Date.now();
  return exports.verifyPayment(req, res);
};
