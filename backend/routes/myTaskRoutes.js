const express = require('express');
const router = express.Router();
const MyTask = require('../models/myTaskModel');

// Get all my tasks for a user
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const myTasks = await MyTask.find({ user: userId }).sort({ assignedAt: -1 });
    res.json(myTasks);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});


// PATCH: Update status of a mytask
router.patch('/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;
    const updated = await MyTask.findByIdAndUpdate(
      taskId,
      { status },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Task not found' });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

module.exports = router;
