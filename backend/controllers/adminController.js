const User = require('../models/User');
const Task = require('../models/taskModel');
// const Dispute = require('../models/disputeModel'); // To be created if not exists

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Block a user
exports.blockUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { blocked: true }, { new: true });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Unblock a user
exports.unblockUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { blocked: false }, { new: true });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a user
exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all tasks
exports.getAllTasks = async (req, res) => {
  try {
    const tasks = await Task.find();
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a task
exports.deleteTask = async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all disputes (placeholder)
exports.getAllDisputes = async (req, res) => {
  // Implement when dispute model exists
  res.json([]);
};

// Resolve a dispute (placeholder)
exports.resolveDispute = async (req, res) => {
  // Implement when dispute model exists
  res.json({ message: 'Dispute resolved (placeholder)' });
};

// Get admin stats (basic example)
exports.getAdminStats = async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const taskCount = await Task.countDocuments();
    // const disputeCount = await Dispute.countDocuments();
    res.json({ userCount, taskCount });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
