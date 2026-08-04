// !! Socket.IO client singleton — auto-connects with the JWT and joins the
// per-user room on the backend (see backend/src/socket.js).
import { io } from "socket.io-client";

function normalizeSocketUrl(url) {
  if (!url) return "http://localhost:5000";
  let value = String(url).trim();
  if (value.startsWith("VITE_API_URL=")) {
    value = value.split("=").slice(1).join("=");
  }
  value = value.replace(/^"|"$/g, "").replace(/^'|'$/g, "").trim();
  value = value.replace(/\/api\/?$/, "").replace(/\/+$/, "");
  return value || "http://localhost:5000";
}

let socket = null;

export function getSocket() {
  const token = localStorage.getItem("hh_token");
  if (!token) return null;
  if (socket && socket.connected) return socket;

  const url = normalizeSocketUrl(import.meta.env.VITE_API_URL || "http://localhost:5000/api");
  socket = io(url, { auth: { token }, autoConnect: true, transports: ["websocket", "polling"] });
  return socket;
}

export function disconnectSocket() {
  if (socket) { socket.disconnect(); socket = null; }
}
