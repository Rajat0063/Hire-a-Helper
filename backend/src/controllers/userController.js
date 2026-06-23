const User = require("../models/User");
const Notification = require("../models/Notification");
const Task = require("../models/Task");
const Request = require("../models/Request");
const { stripUser } = require("./authController");

// === PUT /api/users/me ===
// Email is intentionally not updatable here — by design email is "locked"
// once verified. Profile/cover images come as base64 data URLs.
exports.updateMe = async (req, res) => {
  const allowed = ["firstName", "lastName", "phone", "profilePicture", "coverImage", "bio", "address", "dateOfBirth"];
  const patch = {};
  for (const k of allowed) if (k in req.body) patch[k] = req.body[k];

  const u = await User.findByIdAndUpdate(req.user._id, patch, { new: true }).select("-password");
  res.json({ user: stripUser(u) });
};

// === GET /api/users/notifications ===
exports.notifications = async (req, res) => {
  const list = await Notification.find({ user: req.user._id }).sort("-createdAt").limit(50);
  res.json({ notifications: list });
};

// === PATCH /api/users/notifications/read ===
exports.markRead = async (req, res) => {
  await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
  res.json({ ok: true });
};

// === GET /api/users/overview ===
// Stats shown on the per-user dashboard "Overview" page.
exports.overview = async (req, res) => {
  const uid = req.user._id;
  const [myTasks, sentRequests, receivedRequests] = await Promise.all([
    Task.countDocuments({ user: uid }),
    Request.countDocuments({ requester: uid }),
    Task.find({ user: uid }).select("_id").then((rows) =>
      Request.countDocuments({ task: { $in: rows.map((r) => r._id) } })
    ),
  ]);

  const recent = await Notification.find({ user: uid }).sort("-createdAt").limit(8);

  res.json({
    user: stripUser(req.user),
    counts: {
      myTasks,
      sentRequests,
      receivedRequests,
      totalActions: req.user.stats?.totalActions || 0,
      searches: req.user.stats?.searches || 0,
      messages: 0,
      logins: req.user.stats?.logins || 0,
    },
    recent,
  });
};

// === POST /api/users/bump ===
// Increment generic counters (search, action) from the frontend.
exports.bump = async (req, res) => {
  const { kind } = req.body; // 'search' | 'action'
  const patch = { $inc: { "stats.totalActions": 1 } };
  if (kind === "search") patch.$inc["stats.searches"] = 1;
  await User.updateOne({ _id: req.user._id }, patch);
  res.json({ ok: true });
};
