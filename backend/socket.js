// socket.js
const { Server } = require('socket.io');

let io;
function initSocket(server) {
  io = new Server(server, {
    cors: { origin: '*' }
  });
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    // You can add more event listeners here
  });
}
function getIO() {
  if (!io) throw new Error('Socket.io not initialized!');
  return io;
}
module.exports = { initSocket, getIO };