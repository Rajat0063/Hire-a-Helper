const User = require("../models/User");
const Task = require("../models/Task");
const Request = require("../models/Request");
const AdminLog = require("../models/AdminLog");
const Settings = require("../models/Settings");
const { sign, stripUser } = require("./authController");
const { emitToUser } = require("../socket");

// ~ Central audit-log helper — every admin action funnels through this. ~
async function log(req, action, targetType, targetId, meta = {}) {
  try {
    await AdminLog.create({
      admin: req.user._id,
      action, targetType,
      targetId: targetId ? String(targetId) : "",
      meta,
    });
  } catch (e) { /* never block a real action on log failure */ }
}

exports.adminLogin = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email, role: "admin" });
  if (!user || !(await user.compare(password)))
    return res.status(401).json({ message: "Invalid admin credentials" });
  res.json({ token: sign(user._id), user: stripUser(user) });
};

exports.listUsers = async (_req, res) => {
  const users = await User.find().select("-password").sort("-createdAt");
  res.json({ users });
};

exports.listTasks = async (_req, res) => {
  const tasks = await Task.find().populate("user", "firstName lastName email").sort("-createdAt");
  res.json({ tasks });
};

exports.deleteUser = async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  await log(req, "user.delete", "user", req.params.id);
  res.json({ ok: true });
};

exports.deleteTask = async (req, res) => {
  await Task.findByIdAndDelete(req.params.id);
  await Request.deleteMany({ task: req.params.id });
  await log(req, "task.delete", "task", req.params.id);
  res.json({ ok: true });
};

// === PATCH /api/admin/users/:id/block === body: { blocked: bool }
exports.setBlocked = async (req, res) => {
  const u = await User.findByIdAndUpdate(
    req.params.id,
    { isBlocked: !!req.body.blocked },
    { new: true }
  ).select("-password");
  if (!u) return res.status(404).json({ message: "Not found" });
  await log(req, req.body.blocked ? "user.block" : "user.unblock", "user", u._id, {
    email: u.email, name: `${u.firstName} ${u.lastName}`,
  });
  emitToUser(u._id, req.body.blocked ? "account:blocked" : "account:unblocked", {
    message: req.body.blocked
      ? "Your account has been blocked by an administrator."
      : "Your account has been unblocked.",
  });
  res.json({ user: u });
};

// === GET /api/admin/requests/recent ===
exports.recentRequests = async (_req, res) => {
  const requests = await Request.find()
    .populate("task", "title location")
    .populate("requester", "firstName lastName email")
    .sort("-createdAt")
    .limit(20);
  res.json({ requests });
};

// === GET /api/admin/logs ===
exports.logs = async (_req, res) => {
  const logs = await AdminLog.find()
    .populate("admin", "firstName lastName email")
    .sort("-createdAt")
    .limit(100);
  res.json({ logs });
};

// === GET /api/admin/stats ===
// Extended payload feeds progress-bar analytics on the frontend.
exports.stats = async (_req, res) => {
  const [users, blockedUsers, tasks, requests, completed, totalTasks, open, inProgress, accepted, rejected] =
    await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isBlocked: true }),
      Task.countDocuments({ status: { $in: ["open", "in_progress"] } }),
      Request.countDocuments({ status: "pending" }),
      Task.countDocuments({ status: "completed" }),
      Task.countDocuments(),
      Task.countDocuments({ status: "open" }),
      Task.countDocuments({ status: "in_progress" }),
      Request.countDocuments({ status: "accepted" }),
      Request.countDocuments({ status: "rejected" }),
    ]);
  const completionPct = totalTasks ? Math.round((completed / totalTasks) * 100) : 0;
  const totalReq = await Request.countDocuments();
  res.json({
    users, blockedUsers, tasks, requests, completionPct,
    breakdown: {
      tasks: { total: totalTasks, open, inProgress, completed },
      requests: { total: totalReq, pending: requests, accepted, rejected },
    },
  });
};

// wrap settings updates to log too — settingsController still owns the writes,
// but we log a shallow diff key list here via a lightweight wrapper.
exports.afterSettingsUpdate = async (req, patch) => {
  await AdminLog.create({
    admin: req.user._id,
    action: "settings.update",
    targetType: "settings",
    targetId: "platform",
    meta: { keys: Object.keys(patch || {}) },
  }).catch(() => {});
};
