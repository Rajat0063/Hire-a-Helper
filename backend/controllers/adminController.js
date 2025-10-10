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
      const payload = {
        adminId: req.admin ? req.admin._id : null,
        actionType: 'block_user',
        targetId: user ? user._id : req.params.id,
        targetType: 'User',
        notes: req.body.notes || ''
      };
      await AdminAction.create(payload);
    } catch (err) {
      console.error('Error storing admin action (blockUser). Payload:', {
        admin: req.admin ? { id: req.admin._id, email: req.admin.email } : null,
        params: req.params,
        body: req.body
      }, err && err.message, err && err.stack);
    }
    res.json(user);
  },
  unblockUser: async (req, res) => {
    const user = await User.findByIdAndUpdate(req.params.id, { isBlocked: false }, { new: true });
    try {
      const payload = {
        adminId: req.admin ? req.admin._id : null,
        actionType: 'unblock_user',
        targetId: user ? user._id : req.params.id,
        targetType: 'User',
        notes: req.body.notes || ''
      };
      await AdminAction.create(payload);
    } catch (err) {
      console.error('Error storing admin action (unblockUser). Payload:', {
        admin: req.admin ? { id: req.admin._id, email: req.admin.email } : null,
        params: req.params,
        body: req.body
      }, err && err.message, err && err.stack);
    }
    res.json(user);
  },
  deleteUser: async (req, res) => {
    const user = await User.findByIdAndDelete(req.params.id);
    try {
      const payload = {
        adminId: req.admin ? req.admin._id : null,
        actionType: 'delete_user',
        targetId: req.params.id,
        targetType: 'User',
        notes: req.body.notes || ''
      };
      await AdminAction.create(payload);
    } catch (err) {
      console.error('Error storing admin action (deleteUser). Payload:', {
        admin: req.admin ? { id: req.admin._id, email: req.admin.email } : null,
        params: req.params,
        body: req.body
      }, err && err.message, err && err.stack);
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
      const payload = {
        adminId: req.admin ? req.admin._id : null,
        actionType: 'delete_task',
        targetId: req.params.id,
        targetType: 'Task',
        notes: req.body.notes || ''
      };
      await AdminAction.create(payload);
    } catch (err) {
      console.error('Error storing admin action (deleteTask). Payload:', {
        admin: req.admin ? { id: req.admin._id, email: req.admin.email } : null,
        params: req.params,
        body: req.body
      }, err && err.message, err && err.stack);
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
