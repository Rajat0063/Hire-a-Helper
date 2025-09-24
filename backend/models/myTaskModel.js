const mongoose = require('mongoose');

const myTaskSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
  taskTitle: { type: String, required: true },
  description: { type: String },
  status: { type: String, default: 'assigned' },
  assignedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('MyTask', myTaskSchema);