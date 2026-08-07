const Feedback = require("../models/Feedback");
const Notification = require("../models/Notification");
const User = require("../models/User");
const { emitToUser } = require("../socket");
const mailer = require("../utils/mailer");

// === POST /api/feedback ===
exports.submit = async (req, res) => {
  try {
    const { type, subject, message, rating } = req.body;
    if (!type || !subject || !message) {
      return res.status(400).json({ message: "Type, subject, and message are required" });
    }
    const fb = await Feedback.create({
      user: req.user._id,
      type,
      subject,
      message,
      rating: Number(rating) || 0,
    });

    // Notify admins
    const admins = await User.find({ role: "admin" }).select("_id email");
    for (const a of admins) {
      const n = await Notification.create({
        user: a._id,
        type: "system",
        title: `New feedback (${fb.type})`,
        body: `New feedback (${fb.type}) from ${req.user.firstName}: ${fb.subject}`,
      });
      emitToUser(a._id, "notification:new", n);
      if (a.email && mailer && typeof mailer.sendFeedbackEmail === "function") {
        mailer.sendFeedbackEmail(a.email, {
          from: `${req.user.firstName} ${req.user.lastName} <${req.user.email}>`,
          type: fb.type, subject: fb.subject, message: fb.message, rating: fb.rating,
        }).catch((e) => console.error("[feedback mail]", e.message));
      }
    }

    res.status(201).json({ message: "Feedback submitted successfully. Thank you!", feedback: fb });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// === GET /api/feedback (admin only) ===
exports.list = async (req, res) => {
  const { status, type } = req.query;
  const query = {};
  if (status) query.status = status;
  if (type) query.type = type;
  const items = await Feedback.find(query).populate("user", "firstName lastName email profilePicture").sort({ createdAt: -1 });
  res.json({ feedback: items });
};

// === PATCH /api/feedback/:id (admin) ===
exports.update = async (req, res) => {
  const { status, adminNotes } = req.body;
  const fb = await Feedback.findById(req.id || req.params.id);
  if (!fb) return res.status(404).json({ message: "Feedback not found" });
  if (status) fb.status = status;
  if (adminNotes !== undefined) fb.adminNotes = adminNotes;
  await fb.save();
  res.json({ feedback: fb });
};