
// routes/taskRoutes.js
const express = require('express');
const router = express.Router();
const Task = require('../models/taskModel'); // Make sure the path is correct
const { getIO } = require('../socket');

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
// @access  Public (should be protected later)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedTask = await Task.findByIdAndDelete(id);
    if (!deletedTask) {
      return res.status(404).json({ message: 'Task not found' });
    }
    // Emit socket event for task deletion
    try {
      getIO().emit('task:delete', { _id: id });
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