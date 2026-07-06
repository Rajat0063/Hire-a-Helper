const Review = require("../models/Review");
const Request = require("../models/Request");
const Task = require("../models/Task");

// === POST /api/reviews ===
// body: { taskId, toUserId, rating, comment }
// Either the task OWNER or the WORKER (accepted requester) may review the
// other party once the request is accepted/completed.
exports.create = async (req, res) => {
  const { taskId, toUserId, rating, comment } = req.body;
  const task = await Task.findById(taskId);
  if (!task) return res.status(404).json({ message: "Task not found" });

  const iAmOwner = String(task.user) === String(req.user._id);
  const iAmWorker = String(req.user._id) !== String(task.user);

  // find an accepted/completed request that connects both users on this task
  const reqDoc = await Request.findOne({
    task: taskId,
    $or: [
      { requester: toUserId }, // owner -> worker path
      { requester: req.user._id }, // worker -> owner path
    ],
    status: { $in: ["accepted", "completed"] },
  });
  if (!reqDoc) return res.status(400).json({ message: "Review only allowed after acceptance" });

  // sanity: if I'm the worker, target must be the owner
  if (!iAmOwner && String(toUserId) !== String(task.user))
    return res.status(400).json({ message: "Invalid review target" });
  if (iAmOwner && String(reqDoc.requester) !== String(toUserId))
    return res.status(400).json({ message: "Invalid review target" });

  try {
    const r = await Review.create({
      task: taskId,
      fromUser: req.user._id,
      toUser: toUserId,
      rating: Math.max(1, Math.min(5, Number(rating) || 0)),
      comment: String(comment || "").slice(0, 1000),
    });
    res.status(201).json({ review: r });
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ message: "Already reviewed" });
    throw e;
  }
};

// === GET /api/reviews/user/:id ===
exports.forUser = async (req, res) => {
  const reviews = await Review.find({ toUser: req.params.id })
    .populate("fromUser", "firstName lastName profilePicture")
    .populate("task", "title")
    .sort("-createdAt")
    .limit(50);
  const avg = reviews.length
    ? Math.round((reviews.reduce((a, r) => a + r.rating, 0) / reviews.length) * 10) / 10
    : 0;
  res.json({ reviews, average: avg, count: reviews.length });
};
