// socket.js
const { Server } = require('socket.io');

let io;
function initSocket(server) {
  io = new Server(server, {
    cors: { origin: '*' }
  });
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join user to their own room for private messaging
    socket.on('join', (userId) => {
      socket.join(userId);
    });

    // Listen for chat messages
    socket.on('chat:send', async (data) => {
      // data: { taskId, sender, receiver, message }
      try {
        const { saveChatMessage } = require('./controllers/chatController');
        const savedMsg = await saveChatMessage(data);
        // Emit to receiver and sender (for real-time update)
        io.to(data.receiver).to(data.sender).emit('chat:receive', savedMsg);
      } catch (err) {
        socket.emit('chat:error', { error: 'Failed to send message' });
      }
    });
  });
}
function getIO() {
  if (!io) throw new Error('Socket.io not initialized!');
  return io;
}
module.exports = { initSocket, getIO };