
const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema(
	{
		taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
		senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
		receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
		text: { type: String, required: true },
		timestamp: { type: Date, default: Date.now },
	},
	{ timestamps: true }
);

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
