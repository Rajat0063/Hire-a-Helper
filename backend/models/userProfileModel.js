const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  image: { type: String },
  phoneNumber: { type: String },
  updatedAt: { type: Date, default: Date.now }
}, { collection: 'userprofiles' });

module.exports = mongoose.model('UserProfile', userProfileSchema);