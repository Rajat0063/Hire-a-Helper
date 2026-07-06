// !! Socket.IO client singleton — auto-connects with the JWT and joins the
// per-user room on the backend (see backend/src/socket.js).
import { io } from "socket.io-client";

let socket = null;

export function getSocket() {
  const token = localStorage.getItem("hh_token");
  if (!token) return null;
  if (socket && socket.connected) return socket;

  const url = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");
  socket = io(url, { auth: { token }, autoConnect: true, transports: ["websocket", "polling"] });
  return socket;
}

export function disconnectSocket() {
  if (socket) { socket.disconnect(); socket = null; }
}
