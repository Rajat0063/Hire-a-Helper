const User = require("../models/User");
const Task = require("../models/Task");
const Request = require("../models/Request");
const { sign, stripUser } = require("./authController");

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
  res.json({ ok: true });
};

exports.deleteTask = async (req, res) => {
  await Task.findByIdAndDelete(req.params.id);
  await Request.deleteMany({ task: req.params.id });
  res.json({ ok: true });
};

exports.stats = async (_req, res) => {
  const [users, tasks, requests] = await Promise.all([
    User.countDocuments(),
    Task.countDocuments(),
    Request.countDocuments(),
  ]);
  res.json({ users, tasks, requests });
};
