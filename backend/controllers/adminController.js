const User = require('../models/User');
const Task = require('../models/taskModel');
const AdminAction = require('../models/adminActionModel');
// Dispute model placeholder (implement if needed)
// const Dispute = require('../models/disputeModel');

const adminController = {
  // USERS
  getUsers: async (req, res) => {
    const users = await User.find({});
    res.json(users);
  },
  blockUser: async (req, res) => {
    const user = await User.findByIdAndUpdate(req.params.id, { isBlocked: true }, { new: true });
    try {
      await AdminAction.create({
        adminId: req.admin._id,
        actionType: 'block_user',
        targetId: user._id,
        targetType: 'User',
        notes: req.body.notes || ''
      });
    } catch (err) {
      console.error('Error storing admin action (blockUser):', err);
    }
    res.json(user);
  },
  unblockUser: async (req, res) => {
    const user = await User.findByIdAndUpdate(req.params.id, { isBlocked: false }, { new: true });
    try {
      await AdminAction.create({
        adminId: req.admin._id,
        actionType: 'unblock_user',
        targetId: user._id,
        targetType: 'User',
        notes: req.body.notes || ''
      });
    } catch (err) {
      console.error('Error storing admin action (unblockUser):', err);
    }
    res.json(user);
  },
  deleteUser: async (req, res) => {
    const user = await User.findByIdAndDelete(req.params.id);
    try {
      await AdminAction.create({
        adminId: req.admin._id,
        actionType: 'delete_user',
        targetId: req.params.id,
        targetType: 'User',
        notes: req.body.notes || ''
      });
    } catch (err) {
      console.error('Error storing admin action (deleteUser):', err);
    }
    // Emit socket event to force logout for deleted user
    try {
      const { getIO } = require('../socket');
      const io = getIO();
      io.emit('force-logout', { userId: req.params.id, type: user?.role || 'user' });
    } catch (err) {
      console.error('Error emitting force-logout:', err);
    }
    res.json({ message: 'User deleted' });
  },

  // TASKS
  getTasks: async (req, res) => {
    const tasks = await Task.find({});
    res.json(tasks);
  },
  deleteTask: async (req, res) => {
    const task = await Task.findByIdAndDelete(req.params.id);
    try {
      await AdminAction.create({
        adminId: req.admin._id,
        actionType: 'delete_task',
        targetId: req.params.id,
        targetType: 'Task',
        notes: req.body.notes || ''
      });
    } catch (err) {
      console.error('Error storing admin action (deleteTask):', err);
    }
    res.json({ message: 'Task deleted' });
  },

  // DISPUTES (placeholder)
  getDisputes: async (req, res) => {
    res.json([]); // Implement when dispute model is available
  },
  resolveDispute: async (req, res) => {
    res.json({ message: 'Dispute resolved (implement logic)' });
  },

  // ANALYTICS
  getAnalytics: async (req, res) => {
    const userCount = await User.countDocuments();
    const taskCount = await Task.countDocuments();
    // Add more analytics as needed
    res.json({ userCount, taskCount });
  }
};

module.exports = adminController;
