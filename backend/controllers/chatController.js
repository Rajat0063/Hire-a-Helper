const ChatMessage = require('../models/chatMessageModel');

// Save a new chat message
function saveChatMessage({ taskId, sender, receiver, message }) {
  const chatMsg = new ChatMessage({ taskId, sender, receiver, message });
  return chatMsg.save();
}

// Get chat history for a task
function getChatHistory(taskId) {
  return ChatMessage.find({ taskId }).sort({ timestamp: 1 }).populate('sender receiver', 'name');
}

module.exports = { saveChatMessage, getChatHistory };