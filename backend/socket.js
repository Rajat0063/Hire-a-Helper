// socket.js
const { Server } = require('socket.io');

let io;
function initSocket(server) {
  io = new Server(server, {
    cors: { origin: '*' }
  });
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join chat room for a task/user pair
    socket.on('joinRoom', ({ taskId, userId }) => {
      const room = `${taskId}-${userId}`;
      socket.join(room);
    });

    // Leave chat room
    socket.on('leaveRoom', ({ taskId, userId }) => {
      const room = `${taskId}-${userId}`;
      socket.leave(room);
    });

    // Handle sending messages
    socket.on('sendMessage', (msg) => {
      // Broadcast to both users in the room
      const room = `${msg.taskId}-${msg.userId}`;
      io.to(room).emit('receiveMessage', msg);
      // Notify the receiver (task owner) in real time
      if (msg.receiverId) {
        io.emit(`chat-notification-${msg.receiverId}`, {
          taskId: msg.taskId,
          senderId: msg.userId,
          text: msg.text,
          timestamp: msg.timestamp,
        });
      }
    });
  });
}
function getIO() {
  if (!io) throw new Error('Socket.io not initialized!');
  return io;
}
module.exports = { initSocket, getIO };