const Message = require('../models/messageModel');
const User = require('../models/User');

// Get all conversations for a user (distinct users they've chatted with)
exports.getConversations = async (req, res) => {
  const userId = req.user._id;
  try {
    // Find all messages where user is sender or recipient
    const messages = await Message.find({
      $or: [
        { sender: userId },
        { recipient: userId },
      ],
    }).sort({ createdAt: -1 });

    // Get unique user IDs for conversations
    const userIds = new Set();
    messages.forEach(msg => {
      if (msg.sender.toString() !== userId.toString()) userIds.add(msg.sender.toString());
      if (msg.recipient.toString() !== userId.toString()) userIds.add(msg.recipient.toString());
    });

    // Fetch user details for each conversation
    const users = await User.find({ _id: { $in: Array.from(userIds) } }, 'name email avatar');

    // For each user, get the last message
    const conversations = users.map(u => {
      const lastMsg = messages.find(m => m.sender.toString() === u._id.toString() || m.recipient.toString() === u._id.toString());
      return {
        _id: u._id,
        name: u.name,
        email: u.email,
        avatar: u.avatar || '',
        lastMessage: lastMsg ? lastMsg.text : '',
        lastMessageTime: lastMsg ? lastMsg.createdAt : null,
        unread: messages.filter(m => m.sender.toString() === u._id.toString() && !m.read).length,
      };
    });
    res.json(conversations);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch conversations.' });
  }
};
