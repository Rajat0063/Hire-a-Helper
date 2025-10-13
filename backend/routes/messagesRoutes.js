const express = require('express');
const router = express.Router();
const Message = require('../models/messageModel');
const Conversation = require('../models/conversationModel');

// Get messages for a conversation
router.get('/conversation/:conversationId', async (req, res) => {
  try {
    const msgs = await Message.find({ conversationId: req.params.conversationId }).sort({ createdAt: 1 }).populate('sender', 'name image');
    res.json(msgs);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get conversation metadata by id
router.get('/conversations/:id', async (req, res) => {
  try {
    const convo = await Conversation.findById(req.params.id).populate('participants', 'name image email');
    if (!convo) return res.status(404).json({ message: 'Conversation not found' });
    res.json(convo);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// List conversations for a user
router.get('/conversations/user/:userId', async (req, res) => {
  try {
    const convos = await Conversation.find({ participants: req.params.userId }).sort({ updatedAt: -1 }).populate('participants', 'name image');
    res.json(convos);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Create or get conversation between two users
router.post('/conversation', async (req, res) => {
  try {
    const { participants } = req.body; // array of userIds
    if (!Array.isArray(participants) || participants.length < 2) return res.status(400).json({ message: 'participants required' });
    // Try to find existing conversation with same participants
    const convo = await Conversation.findOne({ participants: { $all: participants, $size: participants.length } });
    if (convo) return res.json(convo);
    const created = await Conversation.create({ participants });
    res.json(created);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
