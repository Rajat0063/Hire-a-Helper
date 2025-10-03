// backend/utils/requestSocketEvents.js
// Utility to emit real-time request updates via socket.io
const { getIO } = require('../socket');
const IncomingRequest = require('../models/incomingRequestModel');

// Emit updated requests to a specific task owner
async function emitRequestsToOwner(taskOwnerId) {
  const io = getIO();
  if (!taskOwnerId) return;
  // Get all pending requests for this owner
  const requests = await IncomingRequest.find({ taskOwner: taskOwnerId, status: 'pending' })
    .sort({ createdAt: -1 });
  io.emit(`requests-update-${taskOwnerId}`, requests);
}

// Emit notification to requester
async function emitNotificationToRequester(requesterId, notification) {
  const io = getIO();
  if (!requesterId) return;
  io.emit(`notification-update-${requesterId}`, notification);
}

module.exports = { emitRequestsToOwner, emitNotificationToRequester };