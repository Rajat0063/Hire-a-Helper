// socket.js
const { Server } = require('socket.io');

let io;
function initSocket(server) {
  // Allow all origins for testing purposes
  io = new Server(server, {
    cors: {
      origin: '*',
      credentials: true,
    }
  });
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    // Listen for user to join their own room after authenticating
    socket.on('join-user-room', (userId) => {
      if (userId) {
        socket.join(`user:${userId}`);
        console.log(`Socket ${socket.id} joined room user:${userId}`);
      }
    });
    // Join a conversation room
    socket.on('join_conversation', (conversationId) => {
      if (conversationId) {
        socket.join(`conversation:${conversationId}`);
        console.log(`Socket ${socket.id} joined room conversation:${conversationId}`);
      }
    });
    // Handle outgoing messages
    socket.on('send_message', async (payload) => {
      try {
        const Message = require('./models/messageModel');
        const Conversation = require('./models/conversationModel');
        // payload should contain conversationId (optional), sender, text
        let convoId = payload.conversationId;
        if (!convoId && Array.isArray(payload.participants)) {
          // create or find conversation
          const existing = await Conversation.findOne({ participants: { $all: payload.participants, $size: payload.participants.length } });
          if (existing) convoId = existing._id;
          else {
            const created = await Conversation.create({ participants: payload.participants });
            convoId = created._id;
          }
        }
        if (!convoId) {
          // cannot persist without conversation id
          console.warn('No conversation id for message, skipping DB save');
        } else {
          const msg = await Message.create({ conversationId: convoId, sender: payload.sender, text: payload.text });
          // populate sender so clients receive name + image (not just id)
          let populatedMsg = msg;
          try {
            populatedMsg = await Message.findById(msg._id).populate('sender', 'name image');
          } catch (err) {
            // fallback to original msg if populate fails
            console.warn('Failed to populate message sender:', err && err.message ? err.message : err);
          }
          // emit to conversation room with populated sender
          io.to(`conversation:${convoId}`).emit('receive_message', populatedMsg.toObject ? populatedMsg.toObject() : populatedMsg);
          // Also notify all participants directly (so offline or not-in-room users get notified)
          try {
            const convo = await Conversation.findById(convoId).lean();
            if (convo && Array.isArray(convo.participants)) {
              convo.participants.forEach(pid => {
                io.to(`user:${pid.toString()}`).emit('new_message_notification', { conversationId: convoId, message: msg.text, from: (populatedMsg.sender && (populatedMsg.sender._id || populatedMsg.sender.id)) ? populatedMsg.sender : payload.sender });
              });
            }
          } catch (err) {
            console.warn('Failed to notify participants via user room:', err && err.message ? err.message : err);
          }
        }
      } catch (err) {
        console.error('Failed to handle send_message in socket:', err && err.message ? err.message : err);
      }
    });
  });
}
function getIO() {
  if (!io) throw new Error('Socket.io not initialized!');
  return io;
}
module.exports = { initSocket, getIO };