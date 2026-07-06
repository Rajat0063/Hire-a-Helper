const Feedback = require("../models/Feedback");
const Notification = require("../models/Notification");
const User = require("../models/User");
const { emitToUser } = require("../socket");
const { sendFeedbackEmail } = require("../utils/mailer");

// === POST /api/feedback ===
exports.submit = async (req, res) => {
  const { type, subject, message, rating } = req.body || {};
  if (!subject || !message) return res.status(400).json({ message: "Subject and message required" });
  const fb = await Feedback.create({
    user: req.user._id,
    type: type || "other",
    subject: String(subject).slice(0, 140),
    message: String(message).slice(0, 4000),
    rating: rating ? Number(rating) : null,
  });

  // ~ Fan-out to every admin so they see it in their notification bell + inbox ~
  const admins = await User.find({ role: "admin" }).select("_id email");
  await Promise.all(
    admins.map(async (a) => {
      const n = await Notification.create({
        user: a._id,
        body: `New feedback (${fb.type}) from ${req.user.firstName}: ${fb.subject}`,
      });
      emitToUser(a._id, "notification:new", n);
      if (a.email) {
        sendFeedbackEmail(a.email, {
          from: `${req.user.firstName} ${req.user.lastName} <${req.user.email}>`,
          type: fb.type, subject: fb.subject, message: fb.message, rating: fb.rating,
        }).catch((e) => console.error("[feedback mail]", e.message));
      }
    })
  );

  res.status(201).json({ feedback: fb });
};

// === GET /api/feedback/mine ===
exports.mine = async (req, res) => {
  const list = await Feedback.find({ user: req.user._id }).sort("-createdAt");
  res.json({ feedback: list });
};

// === GET /api/feedback  (admin) ===
exports.list = async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
  const list = await Feedback.find()
    .populate("user", "firstName lastName email profilePicture")
    .sort("-createdAt")
    .limit(500);
  res.json({ feedback: list });
};

// === PATCH /api/feedback/:id  (admin) ===
exports.update = async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
  const { status, adminNote } = req.body || {};
  const fb = await Feedback.findByIdAndUpdate(
    req.params.id,
    { ...(status && { status }), ...(adminNote != null && { adminNote }) },
    { new: true }
  );
  if (!fb) return res.status(404).json({ message: "Not found" });
  res.json({ feedback: fb });
};
