const User = require('../models/User');
const Task = require('../models/taskModel');
const AdminAction = require('../models/adminActionModel');
// Dispute model placeholder (implement if needed)
// const Dispute = require('../models/disputeModel');

const adminController = {
  // TEST: Create a test admin action manually
  testAdminAction: async (req, res) => {
    try {
      // Use any valid admin and target ObjectId from your DB, or fallback to random ones for test
      const testAction = await AdminAction.create({
        adminId: req.body.adminId || '652e0e0e0e0e0e0e0e0e0e0e',
        actionType: 'test_action',
        targetId: req.body.targetId || '652e0e0e0e0e0e0e0e0e0e0f',
        targetType: 'User',
        notes: 'Test admin action created manually.'
      });
      res.json({ message: 'Test admin action created', testAction });
    } catch (err) {
      console.error('Error creating test admin action:', err);
      res.status(500).json({ message: 'Failed to create test admin action', error: err.message });
    }
  },
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
