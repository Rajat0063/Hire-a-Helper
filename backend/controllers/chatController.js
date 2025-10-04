
const ChatMessage = require('../models/chatMessageModel');

// Get all messages for a task between two users
exports.getMessages = async (req, res) => {
	try {
		const { taskId, userId } = req.params;
		// Find messages where taskId matches and either sender or receiver is userId
		const messages = await ChatMessage.find({
			taskId,
			$or: [
				{ senderId: userId },
				{ receiverId: userId }
			]
		}).sort('timestamp');
		res.json(messages);
	} catch (err) {
		res.status(500).json({ message: 'Failed to fetch messages', error: err.message });
	}
};

// Save a new message
exports.sendMessage = async (req, res) => {
	try {
		const { taskId, userId } = req.params;
		const { text, receiverId } = req.body;
		const message = new ChatMessage({
			taskId,
			senderId: userId,
			receiverId,
			text,
			timestamp: new Date()
		});
		await message.save();
		res.status(201).json(message);
	} catch (err) {
		res.status(500).json({ message: 'Failed to send message', error: err.message });
	}
};
