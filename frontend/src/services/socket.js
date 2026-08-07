// !! Socket.IO client singleton — auto-connects with the JWT and joins the
// per-user room on the backend (see backend/src/socket.js).
import { io } from "socket.io-client";

function normalizeSocketUrl(url) {
  if (!url || url === "/" || url === "/api") {
    if (typeof window !== "undefined") return window.location.origin;
    return "http://localhost:3000";
  }
  let value = String(url).trim();
  if (value.startsWith("VITE_API_URL=")) {
    value = value.split("=").slice(1).join("=");
  }
  value = value.replace(/^"|"$/g, "").replace(/^'|'$/g, "").trim();
  if (value.startsWith("/")) {
    if (typeof window !== "undefined") return window.location.origin;
    return "http://localhost:3000";
  }
  value = value.replace(/^(https?:\/\/)+/, (match) => {
    const firstProto = match.split("://").filter(Boolean)[0];
    return `${firstProto}://`;
  });
  if (typeof window !== "undefined" && window.location.protocol === "https:") {
    value = value.replace(/^http:\/\//i, "https://");
  }
  value = value.replace(/\/api\/?$/, "").replace(/\/+$/, "");
  return value || (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");
}

let socket = null;

export function getSocket() {
  const token = localStorage.getItem("hh_token");
  if (!token) return null;
  if (socket && socket.connected) return socket;

  try {
    const url = normalizeSocketUrl(import.meta.env.VITE_API_URL || "");
    socket = io(url, {
      auth: { token },
      autoConnect: true,
      transports: ["websocket", "polling"],
      reconnectionAttempts: 3,
      timeout: 5000,
    });
    socket.on("connect_error", () => {
      // Graceful fallback if realtime socket is unreachable
    });
    return socket;
  } catch {
    return null;
  }
}

export function disconnectSocket() {
  if (socket) { socket.disconnect(); socket = null; }
}
