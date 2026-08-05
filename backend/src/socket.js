// !! Socket.IO singleton — auth via JWT, per-user rooms named `user:<id>`.
// Emits realtime events for notifications, requests, tasks, messages.
const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");

let io = null;

function init(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_URL || "*", credentials: true },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("no token"));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch {
      next(new Error("bad token"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(`user:${socket.userId}`);
  });

  return io;
}

// ~ tiny helper — guard against the no-server case (e.g. tests)
function emitToUser(userId, event, payload) {
  if (!io || !userId) return;
  io.to(`user:${String(userId)}`).emit(event, payload);
}

// Broadcast to every connected socket (used for maintenance mode etc.)
function broadcastAll(event, payload) {
  if (!io) return;
  io.emit(event, payload);
}

module.exports = { init, emitToUser, broadcastAll, get io() { return io; } };
