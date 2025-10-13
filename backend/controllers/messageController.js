const Message = require('../models/messageModel');

// Get all messages between two users
exports.getMessages = async (req, res) => {
  const { userId, recipientId } = req.query;
  try {
    const messages = await Message.find({
      $or: [
        { sender: userId, recipient: recipientId },
        { sender: recipientId, recipient: userId },
      ],
    }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch messages.' });
  }
};

// Send a new message
exports.sendMessage = async (req, res) => {
  const { sender, recipient, text } = req.body;
  if (!sender || !recipient || !text) {
    return res.status(400).json({ message: 'Missing required fields.' });
  }
  try {
    const message = await Message.create({ sender, recipient, text });
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ message: 'Failed to send message.' });
  }
};
