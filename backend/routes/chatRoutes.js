
const express = require('express');
const router = express.Router();
const { getMessages, sendMessage } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

// Get all messages for a task between two users
router.get('/:taskId/:userId', protect, getMessages);

// Send a new message
router.post('/:taskId/:userId', protect, sendMessage);

module.exports = router;
