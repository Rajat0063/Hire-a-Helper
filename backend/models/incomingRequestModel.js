const mongoose = require('mongoose');

const incomingRequestSchema = new mongoose.Schema({
  requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  requesterName: { type: String, required: true },
  task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
  taskTitle: { type: String, required: true },
  taskOwner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  taskOwnerName: { type: String, required: true },
  message: { type: String },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  seenBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: [] }],
  createdAt: { type: Date, default: Date.now }
}, { collection: 'incomingrequests' });

module.exports = mongoose.model('IncomingRequest', incomingRequestSchema);