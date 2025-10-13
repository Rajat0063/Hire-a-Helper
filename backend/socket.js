// socket.js
const { Server } = require('socket.io');

let io;
function initSocket(server) {
  const allowedOrigins = [
    process.env.FRONTEND_URL, // e.g. https://hire-a-helper-yr.vercel.app
    'http://localhost:5173',
    'http://localhost:3000',
  ].filter(Boolean);
  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
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
          // emit to conversation room
          io.to(`conversation:${convoId}`).emit('receive_message', { ...msg.toObject(), sender: payload.sender });
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