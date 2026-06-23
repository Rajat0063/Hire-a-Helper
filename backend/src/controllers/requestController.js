const Request = require("../models/Request");
const Task = require("../models/Task");
const Notification = require("../models/Notification");

exports.received = async (req, res) => {
  const myTasks = await Task.find({ user: req.user._id }).select("_id");
  const ids = myTasks.map((t) => t._id);
  const requests = await Request.find({ task: { $in: ids } })
    .populate("task")
    .populate("requester", "firstName lastName email profilePicture")
    .sort("-createdAt");
  res.json({ requests });
};

exports.sent = async (req, res) => {
  const requests = await Request.find({ requester: req.user._id })
    .populate({ path: "task", populate: { path: "user", select: "firstName lastName" } })
    .sort("-createdAt");
  res.json({ requests });
};

exports.update = async (req, res) => {
  const { status } = req.body;
  const r = await Request.findById(req.params.id).populate("task");
  if (!r) return res.status(404).json({ message: "Not found" });
  if (String(r.task.user) !== String(req.user._id))
    return res.status(403).json({ message: "Forbidden" });
  r.status = status;
  await r.save();
  await Notification.create({
    user: r.requester,
    body: `Your request for "${r.task.title}" was ${status}`,
  });
  res.json({ request: r });
};
