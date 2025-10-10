// routes/taskRoutes.js

const express = require('express');
const router = express.Router();
const Task = require('../models/taskModel'); // Make sure the path is correct
const AdminAction = require('../models/adminActionModel');
const { getIO } = require('../socket');
const { protect } = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// @desc    Update a task
// @route   PUT /api/tasks/:id
// @access  Public (should be protected later)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const updatedTask = await Task.findByIdAndUpdate(id, updates, { new: true });
    if (!updatedTask) {
      return res.status(404).json({ message: 'Task not found' });
    }
    // Emit socket event for task update
    try {
      getIO().emit('task:update', updatedTask);
    } catch (e) {
      console.warn('Socket.io not initialized:', e.message);
    }
    res.json(updatedTask);
  } catch (error) {
    console.error('PUT /api/tasks/:id error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Admin
router.delete('/:id', protect, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
  // Get adminId from req.admin (set by adminMiddleware)
  const adminId = req.admin ? req.admin._id : null;
    const deletedTask = await Task.findByIdAndDelete(id);
    if (!deletedTask) {
      return res.status(404).json({ message: 'Task not found' });
    }
    // Log admin action
    if (adminId) {
      try {
        const payload = { adminId, actionType: 'delete_task', targetId: id, targetType: 'Task', notes: `Task deleted by admin` };
        console.log('AdminAction payload (taskRoutes delete):', payload);
        await AdminAction.create(payload);
        console.log('AdminAction created (taskRoutes delete)');
      } catch (err) {
        console.error('Error storing admin action (taskRoutes delete):', err && err.message ? err.message : err);
        if (err && err.name === 'ValidationError' && err.errors) {
          Object.entries(err.errors).forEach(([field, e]) => console.error('Validation error', field, e.message));
        }
      }
    }
    // Emit socket event for task deletion (real-time)
    try {
      getIO().emit('admin:task-deleted', id);
    } catch (e) {
      console.warn('Socket.io not initialized:', e.message);
    }
    res.json({ message: 'Task deleted', deletedTask });
  } catch (error) {
    console.error('DELETE /api/tasks/:id error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @desc    Fetch all tasks for the feed
// @route   GET /api/tasks
// @access  Public
router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find({}).sort({ createdAt: -1 }); // Get newest first
    res.json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Public (should be protected later)
router.post('/', async (req, res) => {
  try {
    console.log('POST /api/tasks body:', req.body);
    const { title, description, category, location, postedByName, startTime, endTime, imageUrl, userImageUrl } = req.body;

    // Validate required fields
    if (!title || !description || !category || !location || !postedByName || !startTime) {
      return res.status(400).json({ message: 'Missing required fields. Required: title, description, category, location, postedByName, startTime.' });
    }

    // Validate startTime
    if (isNaN(Date.parse(startTime))) {
      return res.status(400).json({ message: 'Invalid startTime format. Must be a valid date string.' });
    }

    const task = new Task({
      title,
      description,
      category,
      location,
      postedByName,
      startTime,
      endTime,
      imageUrl,
      userImageUrl,
    });

    const createdTask = await task.save();
    // Emit socket event for new task
    try {
      getIO().emit('task:new', createdTask);
    } catch (e) {
      console.warn('Socket.io not initialized:', e.message);
    }
    res.status(201).json(createdTask);
  } catch (error) {
    console.error('POST /api/tasks error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

module.exports = router;