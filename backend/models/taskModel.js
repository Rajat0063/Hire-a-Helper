// backend/models/taskModel.js

const mongoose = require('mongoose');

const taskSchema = mongoose.Schema(
  {
    postedByName: { type: String, required: true },
    title: { type: String, required: [true, 'Please add a title'] },
    description: { type: String, required: [true, 'Please add a description'] },
    category: { type: String, required: true },
    location: { type: String, required: true },

    // ⭐️ NEW: Added fields to match your frontend UI
    imageUrl: { type: String, default: 'https://picsum.photos/seed/default/400/200' },
    userImageUrl: { type: String, default: 'https://i.pravatar.cc/150' },
    startTime: { type: Date, required: true },
    endTime: { type: Date }, // Optional
  },
  {
    timestamps: true, // This adds createdAt and updatedAt automatically
  }
);

module.exports = mongoose.model('Task', taskSchema);