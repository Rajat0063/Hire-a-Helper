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

    const submitterId = String(req.user._id);
    const submitterEmail = (req.user.email || "").toLowerCase().trim();
    const ownerEmail = (process.env.ADMIN_EMAIL || process.env.OWNER_EMAIL || "rajatyadav5641@gmail.com").toLowerCase().trim();

    // 1. Notify other platform administrators in-app (excluding the submitter)
    const admins = await User.find({ role: "admin", _id: { $ne: req.user._id } }).select("_id email firstName");
    for (const a of admins) {
      const n = await Notification.create({
        user: a._id,
        type: "feedback",
        title: `New feedback (${fb.type})`,
        body: `New ${fb.type} from ${req.user.firstName || "User"}: "${fb.subject}"`,
        link: "/admin",
        actor: req.user._id,
        category: "system",
        data: { feedbackId: fb._id, type: fb.type, rating: fb.rating },
      });
      emitToUser(a._id, "notification:new", n);

      // Email other admin if email is different from submitter
      const adminEmail = (a.email || "").toLowerCase().trim();
      if (adminEmail && adminEmail !== submitterEmail && mailer && typeof mailer.sendFeedbackEmail === "function") {
        mailer.sendFeedbackEmail(a.email, {
          from: `${req.user.firstName || "User"} ${req.user.lastName || ""} <${req.user.email}>`,
          type: fb.type, subject: fb.subject, message: fb.message, rating: fb.rating,
        }).catch((e) => console.error("[feedback mail to admin]", e.message));
      }
    }

    // 2. Deliver email to the application owner (if configured and not the submitter)
    if (ownerEmail && ownerEmail !== submitterEmail && mailer && typeof mailer.sendFeedbackEmail === "function") {
      const alreadySent = admins.some((a) => (a.email || "").toLowerCase().trim() === ownerEmail);
      if (!alreadySent) {
        mailer.sendFeedbackEmail(ownerEmail, {
          from: `${req.user.firstName || "User"} ${req.user.lastName || ""} <${req.user.email}>`,
          type: fb.type, subject: fb.subject, message: fb.message, rating: fb.rating,
        }).catch((e) => console.error("[feedback mail to owner]", e.message));
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