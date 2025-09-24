// routes/taskRoutes.js

const express = require('express');
const router = express.Router();
const Task = require('../models/taskModel'); // Make sure the path is correct

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
    res.status(201).json(createdTask);
  } catch (error) {
    console.error('POST /api/tasks error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

module.exports = router;