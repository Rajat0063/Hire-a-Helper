const User = require("../models/User");
const Notification = require("../models/Notification");
const Task = require("../models/Task");
const Request = require("../models/Request");
const Review = require("../models/Review");
const { stripUser } = require("./authController");

// === GET /api/users/:id/public ===
// Whitelisted public fields. Email + phone are ONLY included when the
// viewer already has an accepted/completed request with the target user
// in either direction. When such a link exists the response also flags
// `canReview: true` and returns the tasks the viewer can rate.
exports.publicProfile = async (req, res) => {
  const u = await User.findById(req.params.id).select(
    "firstName lastName email phone profilePicture coverImage bio address createdAt phoneVerified"
  );
  if (!u) return res.status(404).json({ message: "Not found" });

  const viewerId = req.user._id;
  const targetId = u._id;

  // ~ Find any accepted/completed connection between viewer and target ~
  const myTaskIds = (await Task.find({ user: viewerId }).select("_id")).map((t) => t._id);
  const targetTaskIds = (await Task.find({ user: targetId }).select("_id")).map((t) => t._id);

  const [asOwner, asWorker] = await Promise.all([
    // viewer owns tasks, target is requester
    Request.find({ task: { $in: myTaskIds }, requester: targetId, status: { $in: ["accepted", "completed"] } })
      .populate("task", "title"),
    // viewer is requester on target's tasks
    Request.find({ task: { $in: targetTaskIds }, requester: viewerId, status: { $in: ["accepted", "completed"] } })
      .populate("task", "title"),
  ]);
  const connected = asOwner.length > 0 || asWorker.length > 0;

  const [reviews, helped, posted] = await Promise.all([
    Review.find({ toUser: u._id })
      .populate("fromUser", "firstName lastName profilePicture")
      .populate("task", "title")
      .sort("-createdAt").limit(50),
    Request.countDocuments({ requester: u._id, status: { $in: ["accepted", "completed"] } }),
    Task.countDocuments({ user: u._id }),
  ]);
  const avg = reviews.length
    ? Math.round((reviews.reduce((a, r) => a + r.rating, 0) / reviews.length) * 10) / 10
    : 0;

  // ~ Tasks the viewer can review the target on (one review per task pair) ~
  const reviewable = [];
  for (const r of [...asOwner, ...asWorker]) {
    const already = await Review.findOne({ task: r.task._id, fromUser: viewerId, toUser: targetId });
    if (!already) reviewable.push({ taskId: r.task._id, title: r.task.title });
  }

  res.json({
    user: {
      id: u._id,
      firstName: u.firstName,
      lastName: u.lastName,
      profilePicture: u.profilePicture,
      coverImage: u.coverImage,
      bio: u.bio,
      address: u.address,
      joinedAt: u.createdAt,
      // ! Contact fields only present when connected via accepted request
      email: connected ? u.email : undefined,
      phone: connected ? u.phone : undefined,
      phoneVerified: connected ? u.phoneVerified : undefined,
    },
    stats: { helped, posted, rating: avg, reviewCount: reviews.length },
    reviews,
    connected,
    canReview: reviewable.length > 0,
    reviewable,
  });
};

// === PUT /api/users/me ===
// Email is intentionally NOT updatable. Profile/cover images come as base64
// data URLs (stored verbatim in MongoDB).
exports.updateMe = async (req, res) => {
  const allowed = [
    "firstName", "lastName", "phone", "profilePicture", "coverImage",
    "bio", "address", "dateOfBirth",
  ];
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
exports.overview = async (req, res) => {
  const uid = req.user._id;

  const [myTasks, completedTasks, sentRequests, helped, receivedRequests] = await Promise.all([
    Task.countDocuments({ user: uid }),
    Task.countDocuments({ user: uid, status: "completed" }),
    Request.countDocuments({ requester: uid }),
    Request.countDocuments({ requester: uid, status: "accepted" }),
    Task.find({ user: uid }).select("_id").then((rows) =>
      Request.countDocuments({ task: { $in: rows.map((r) => r._id) } })
    ),
  ]);

  const recent = await Notification.find({ user: uid }).sort("-createdAt").limit(8);

  // ~ ratings for me as a worker ~
  const myReviews = await Review.find({ toUser: uid }).select("rating");
  const ratingAvg = myReviews.length
    ? Math.round((myReviews.reduce((a, r) => a + r.rating, 0) / myReviews.length) * 10) / 10
    : 0;

  res.json({
    user: stripUser(req.user),
    counts: {
      myTasks,
      completedTasks,
      sentRequests,
      receivedRequests,
      helped,
      completionPct: myTasks ? Math.round((completedTasks / myTasks) * 100) : 0,
      totalActions: req.user.stats?.totalActions || 0,
      searches: req.user.stats?.searches || 0,
      messages: 0,
      logins: req.user.stats?.logins || 0,
      rating: ratingAvg,
      reviewCount: myReviews.length,
    },
    recent,
  });
};

// === POST /api/users/bump ===
exports.bump = async (req, res) => {
  const { kind } = req.body;
  const patch = { $inc: { "stats.totalActions": 1 } };
  if (kind === "search") patch.$inc["stats.searches"] = 1;
  await User.updateOne({ _id: req.user._id }, patch);
  res.json({ ok: true });
};
