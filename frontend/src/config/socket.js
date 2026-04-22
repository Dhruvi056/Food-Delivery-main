import { io } from 'socket.io-client';

let socket = null;

export function connectSocket(userId) {
  if (socket?.connected) return socket;
  
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";
  
  socket = io(apiUrl, {
    auth: { token: localStorage.getItem('token') } // Note: we use 'token' as key in previous turn fixes
  });
  
  socket.on('connect', () => {
    socket.emit('join_user', userId);
    console.log('🔌 Socket connected and joined user room:', userId);
  });
  
  return socket;
}

export function getSocket() { return socket; }

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
