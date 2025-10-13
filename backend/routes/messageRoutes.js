const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Get all messages between two users
router.get('/', authMiddleware, messageController.getMessages);

// Send a new message
router.post('/', authMiddleware, messageController.sendMessage);

module.exports = router;
