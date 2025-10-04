const express = require('express');
const { getChatHistory } = require('../controllers/chatController');
const router = express.Router();

// GET /api/chat/:taskId - get chat history for a task
router.get('/:taskId', async (req, res) => {
  try {
    const messages = await getChatHistory(req.params.taskId);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

module.exports = router;
