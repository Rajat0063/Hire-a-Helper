const User = require('../models/User');
const Task = require('../models/taskModel');
const AdminAction = require('../models/adminActionModel');
const { getIO } = require('../socket');
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
        adminId: req.admin && req.admin._id,
        actionType: 'block_user',
        targetId: user && user._id,
        targetType: 'User',
        notes: req.body.notes || ''
      };
      console.log('AdminAction payload (blockUser):', payload);
      const created = await AdminAction.create(payload);
      console.log('AdminAction created (blockUser)');
      // Emit real-time admin events
      try {
        const io = getIO();
        io.emit('admin:action-created', created);
        // notify admins about user update
        io.emit('admin:user-updated', user);
        // update analytics
        const userCount = await User.countDocuments();
        const taskCount = await Task.countDocuments();
        io.emit('admin:analytics-updated', { userCount, taskCount });
      } catch (socketErr) {
        console.warn('Socket emit failed (blockUser):', socketErr && socketErr.message ? socketErr.message : socketErr);
      }
    } catch (err) {
      console.error('Error storing admin action (blockUser):', err && err.message ? err.message : err);
      if (err && err.name === 'ValidationError' && err.errors) {
        Object.entries(err.errors).forEach(([field, e]) => console.error('Validation error', field, e.message));
      }
    }
    res.json(user);
  },
  unblockUser: async (req, res) => {
    const user = await User.findByIdAndUpdate(req.params.id, { isBlocked: false }, { new: true });
    try {
      const payload = {
        adminId: req.admin && req.admin._id,
        actionType: 'unblock_user',
        targetId: user && user._id,
        targetType: 'User',
        notes: req.body.notes || ''
      };
      console.log('AdminAction payload (unblockUser):', payload);
      const created = await AdminAction.create(payload);
      console.log('AdminAction created (unblockUser)');
      try {
        const io = getIO();
        io.emit('admin:action-created', created);
        io.emit('admin:user-updated', user);
        const userCount = await User.countDocuments();
        const taskCount = await Task.countDocuments();
        io.emit('admin:analytics-updated', { userCount, taskCount });
      } catch (socketErr) {
        console.warn('Socket emit failed (unblockUser):', socketErr && socketErr.message ? socketErr.message : socketErr);
      }
    } catch (err) {
      console.error('Error storing admin action (unblockUser):', err && err.message ? err.message : err);
      if (err && err.name === 'ValidationError' && err.errors) {
        Object.entries(err.errors).forEach(([field, e]) => console.error('Validation error', field, e.message));
      }
    }
    res.json(user);
  },
  deleteUser: async (req, res) => {
    const user = await User.findByIdAndDelete(req.params.id);
    try {
      // Prefer the admin from adminMiddleware, fallback to req.user (self-delete or other flows)
      const adminId = (req.admin && req.admin._id) || (req.user && req.user._id) || null;
      const payload = {
        adminId,
        actionType: 'delete_user',
        targetId: req.params.id,
        targetType: 'User',
        notes: req.body.notes || ''
      };
      console.log('AdminAction payload (deleteUser):', payload);
      if (adminId) {
        const created = await AdminAction.create(payload);
        console.log('AdminAction created (deleteUser)');
        try {
          const io = getIO();
          io.emit('admin:action-created', created);
          io.emit('admin:user-deleted', req.params.id);
          const userCount = await User.countDocuments();
          const taskCount = await Task.countDocuments();
          io.emit('admin:analytics-updated', { userCount, taskCount });
        } catch (socketErr) {
          console.warn('Socket emit failed (deleteUser):', socketErr && socketErr.message ? socketErr.message : socketErr);
        }
      } else {
        console.warn('Skipping AdminAction.create for deleteUser because no adminId found on request');
      }
    } catch (err) {
      console.error('Error storing admin action (deleteUser):', err && err.message ? err.message : err);
      if (err && err.name === 'ValidationError' && err.errors) {
        Object.entries(err.errors).forEach(([field, e]) => console.error('Validation error', field, e.message));
      }
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
        adminId: req.admin && req.admin._id,
        actionType: 'delete_task',
        targetId: req.params.id,
        targetType: 'Task',
        notes: req.body.notes || ''
      };
      console.log('AdminAction payload (deleteTask):', payload);
      const created = await AdminAction.create(payload);
      console.log('AdminAction created (deleteTask)');
      try {
        const io = getIO();
        io.emit('admin:action-created', created);
        io.emit('admin:task-deleted', req.params.id);
        const userCount = await User.countDocuments();
        const taskCount = await Task.countDocuments();
        io.emit('admin:analytics-updated', { userCount, taskCount });
      } catch (socketErr) {
        console.warn('Socket emit failed (deleteTask):', socketErr && socketErr.message ? socketErr.message : socketErr);
      }
    } catch (err) {
      console.error('Error storing admin action (deleteTask):', err && err.message ? err.message : err);
      if (err && err.name === 'ValidationError' && err.errors) {
        Object.entries(err.errors).forEach(([field, e]) => console.error('Validation error', field, e.message));
      }
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
  ,
  // ADMIN ACTIONS (for debugging / audit)
  getAdminActions: async (req, res) => {
    try {
      const actions = await AdminAction.find({}).sort({ createdAt: -1 }).limit(200);
      res.json(actions);
    } catch (err) {
      console.error('Error fetching admin actions:', err && err.message ? err.message : err);
      res.status(500).json({ message: 'Failed to fetch admin actions' });
    }
  }
};

module.exports = adminController;
