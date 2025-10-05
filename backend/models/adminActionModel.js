const mongoose = require('mongoose');

const adminActionSchema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  actionType: { type: String, required: true }, // e.g., 'block_user', 'resolve_dispute', etc.
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true }, // user, task, or dispute id
  targetType: { type: String, required: true }, // 'User', 'Task', 'Dispute'
  notes: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AdminAction', adminActionSchema);