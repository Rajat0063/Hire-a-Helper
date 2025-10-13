const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  metadata: { type: Object, default: {} },
}, { timestamps: true });

module.exports = mongoose.model('Conversation', conversationSchema);
