const mongoose = require('mongoose');

const userProfileHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  field: { type: String, required: true },
  oldValue: { type: String },
  newValue: { type: String },
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  changedAt: { type: Date, default: Date.now }
}, { collection: 'userprofilehistories' });

module.exports = mongoose.model('UserProfileHistory', userProfileHistorySchema);