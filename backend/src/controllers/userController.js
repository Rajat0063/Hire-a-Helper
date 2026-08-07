const User = require("../models/User");
const Notification = require("../models/Notification");
const Task = require("../models/Task");
const Request = require("../models/Request");
const Review = require("../models/Review");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
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
    Request.countDocuments({ requester: u._id, status: { $in: ["accepted", "in_progress", "completed"] } }),
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
  try {
    const { type, unreadOnly, limit = 50 } = req.query;
    const filter = { user: req.user._id };
    if (type && type !== "all") {
      filter.type = type;
    }
    if (unreadOnly === "true" || unreadOnly === true) {
      filter.read = false;
    }
    const [list, unreadCount, totalCount] = await Promise.all([
      Notification.find(filter)
        .populate("actor", "firstName lastName profilePicture")
        .sort("-createdAt")
        .limit(Math.min(100, Math.max(1, Number(limit) || 50))),
      Notification.countDocuments({ user: req.user._id, read: false }),
      Notification.countDocuments({ user: req.user._id }),
    ]);
    res.json({ notifications: list, unreadCount, totalCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// === PATCH /api/users/notifications/read ===
exports.markRead = async (req, res) => {
  try {
    const { ids } = req.body || {};
    const filter = { user: req.user._id };
    if (Array.isArray(ids) && ids.length) {
      filter._id = { $in: ids };
    }
    await Notification.updateMany(filter, { $set: { read: true } });
    const unreadCount = await Notification.countDocuments({ user: req.user._id, read: false });
    res.json({ ok: true, unreadCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// === PATCH /api/users/notifications/:id/read ===
exports.toggleNotificationRead = async (req, res) => {
  try {
    const notif = await Notification.findOne({ _id: req.params.id, user: req.user._id });
    if (!notif) return res.status(404).json({ message: "Notification not found" });
    notif.read = req.body.read !== undefined ? Boolean(req.body.read) : !notif.read;
    await notif.save();
    const unreadCount = await Notification.countDocuments({ user: req.user._id, read: false });
    res.json({ ok: true, notification: notif, unreadCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// === DELETE /api/users/notifications/:id ===
exports.deleteNotification = async (req, res) => {
  try {
    const notif = await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!notif) return res.status(404).json({ message: "Notification not found" });
    const unreadCount = await Notification.countDocuments({ user: req.user._id, read: false });
    res.json({ ok: true, unreadCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// === DELETE /api/users/notifications/clear-all ===
exports.clearAllNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({ user: req.user._id });
    res.json({ ok: true, unreadCount: 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// === GET /api/users/overview ===
exports.overview = async (req, res) => {
  try {
    const uid = req.user._id;

    // ~ Fetch user conversations and participant details ~
    const rawConvos = await Conversation.find({ participants: uid })
      .populate("participants", "firstName lastName email profilePicture")
      .populate("task", "title image location paymentAmount")
      .sort("-lastAt")
      .limit(8);

    const convoIds = rawConvos.map((c) => c._id);

    const myTaskDocs = await Task.find({ user: uid }).select("_id title");
    const myTaskIds = myTaskDocs.map((t) => t._id);

    const [
      myTasks,
      completedTasks,
      sentRequests,
      helped,
      receivedRequests,
      messageCount,
      helpersReceived,
      tasksHelped,
    ] = await Promise.all([
      Task.countDocuments({ user: uid }),
      Task.countDocuments({ user: uid, status: "completed" }),
      Request.countDocuments({ requester: uid }),
      Request.countDocuments({ requester: uid, status: { $in: ["accepted", "in_progress", "completed"] } }),
      Request.countDocuments({ task: { $in: myTaskIds } }),
      Message.countDocuments({
        $or: [
          { sender: uid },
          { conversation: { $in: convoIds } },
        ],
      }),
      Request.find({ task: { $in: myTaskIds }, status: { $in: ["accepted", "in_progress", "completed"] } })
        .populate("requester", "firstName lastName profilePicture email phone")
        .populate("task", "title paymentAmount")
        .sort("-updatedAt")
        .limit(10),
      Request.find({ requester: uid, status: { $in: ["accepted", "in_progress", "completed"] } })
        .populate({
          path: "task",
          select: "title user paymentAmount location",
          populate: { path: "user", select: "firstName lastName profilePicture" },
        })
        .sort("-updatedAt")
        .limit(10),
    ]);

    const recent = await Notification.find({ user: uid }).sort("-createdAt").limit(8);

    // Format conversations for the overview view
    const conversations = rawConvos.map((c) => {
      const other = c.participants.find((p) => String(p._id) !== String(uid));
      return {
        _id: c._id,
        otherUser: other ? {
          _id: other._id,
          firstName: other.firstName,
          lastName: other.lastName,
          email: other.email,
          profilePicture: other.profilePicture,
        } : null,
        task: c.task,
        lastMessage: c.lastMessage,
        lastAt: c.lastAt || c.updatedAt,
      };
    });

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
        helpersCount: helpersReceived.length,
        completionPct: myTasks ? Math.round((completedTasks / myTasks) * 100) : 0,
        totalActions: req.user.stats?.totalActions || 0,
        searches: req.user.stats?.searches || 0,
        messages: messageCount,
        logins: req.user.stats?.logins || 0,
        rating: ratingAvg,
        reviewCount: myReviews.length,
      },
      conversations,
      helpers: helpersReceived,
      tasksHelped,
      recent,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// === POST /api/users/bump ===
exports.bump = async (req, res) => {
  const { kind } = req.body;
  const patch = { $inc: { "stats.totalActions": 1 } };
  if (kind === "search") patch.$inc["stats.searches"] = 1;
  await User.updateOne({ _id: req.user._id }, patch);
  res.json({ ok: true });
};
