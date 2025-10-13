const express = require('express');
const router = express.Router();
const conversationController = require('../controllers/conversationController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Get all conversations for a user
router.get('/', authMiddleware, conversationController.getConversations);

module.exports = router;
