const Task = require("../models/Task");
const Request = require("../models/Request");
const Notification = require("../models/Notification");

// === GET /api/tasks ===
// Optional ?q=... filter: matches title, description, location, category.
exports.feed = async (req, res) => {
  const q = (req.query.q || "").trim();
  const base = { status: "open" };
  if (q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    base.$or = [{ title: rx }, { description: rx }, { location: rx }, { category: rx }];
  }
  const tasks = await Task.find(base)
    .populate("user", "firstName lastName profilePicture")
    .sort("-createdAt");
  res.json({ tasks });
};

// === GET /api/tasks/mine ===
exports.mine = async (req, res) => {
  const tasks = await Task.find({ user: req.user._id }).sort("-createdAt");
  res.json({ tasks });
};

// === POST /api/tasks ===
exports.create = async (req, res) => {
  const {
    title, description, location, category,
    startTime, endTime, image, paymentAmount, currency,
  } = req.body;

  const task = await Task.create({
    user: req.user._id,
    title, description, location,
    category: category || "Other",
    startTime, endTime,
    image: image || "",
    paymentAmount: Number(paymentAmount) || 0,
    currency: currency || "USD",
  });
  res.status(201).json({ task });
};

// === POST /api/tasks/:id/request ===
exports.requestTask = async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ message: "Task not found" });
  if (String(task.user) === String(req.user._id))
    return res.status(400).json({ message: "Cannot request your own task" });

  try {
    const r = await Request.create({ task: task._id, requester: req.user._id });
    await Notification.create({
      user: task.user,
      body: `${req.user.firstName} requested to help with "${task.title}"`,
    });
    res.status(201).json({ request: r });
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ message: "Already requested" });
    throw e;
  }
};
