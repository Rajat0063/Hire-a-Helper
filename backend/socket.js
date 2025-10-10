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
  });
}
function getIO() {
  if (!io) throw new Error('Socket.io not initialized!');
  return io;
}
module.exports = { initSocket, getIO };