import { io } from "socket.io-client";
import { resolveSocketUserId } from "../utils/jwt.js";

let socket = null;

function emitJoinUser(uid) {
  if (socket?.connected && uid) {
    socket.emit("join_user", uid);
  }
}

/**
 * Single shared Socket.IO client. Re-joins user room whenever user id can be resolved.
 */
export function connectSocket(userId) {
  const token = localStorage.getItem("token");
  if (!token) return null;

  const uid = resolveSocketUserId(userId);
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";

  if (socket?.connected) {
    emitJoinUser(uid);
    return socket;
  }

  if (!socket) {
    socket = io(apiUrl, {
      auth: { token },
    });
    socket.on("connect", () => {
      const id = resolveSocketUserId();
      emitJoinUser(id);
      if (id) {
        console.log("Socket connected; joined user room:", id);
      }
    });
  }

  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}
