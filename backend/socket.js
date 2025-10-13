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

    // Real-time chat: join a chat room for 1-to-1 conversation
    socket.on('joinRoom', ({ userId, recipientId }) => {
      if (userId && recipientId) {
        // Room name is always sorted to ensure both users join the same room
        const room = [userId, recipientId].sort().join(':');
        socket.join(room);
        socket.room = room;
      }
    });

    // Handle sending messages
    socket.on('message', async (msg) => {
      // msg: { sender, recipient, text, createdAt }
      try {
        // Save message to DB
        const Message = require('./models/messageModel');
        const saved = await Message.create({
          sender: msg.sender,
          recipient: msg.recipient,
          text: msg.text,
          createdAt: msg.createdAt || new Date(),
        });
        // Emit to both users in the room
        const room = [msg.sender, msg.recipient].sort().join(':');
        io.to(room).emit('message', saved);
      } catch (err) {
        console.error('Socket message error:', err);
      }
    });

    socket.on('leaveRoom', ({ userId, recipientId }) => {
      if (userId && recipientId) {
        const room = [userId, recipientId].sort().join(':');
        socket.leave(room);
      }
    });
  });
}
function getIO() {
  if (!io) throw new Error('Socket.io not initialized!');
  return io;
}
module.exports = { initSocket, getIO };