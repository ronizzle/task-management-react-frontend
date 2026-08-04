import { io } from 'socket.io-client';

const NODE_API_URL = import.meta.env.VITE_NODE_API_URL || 'http://localhost:3000/api';
// Socket.IO listens on the Node service's own root, not under /api.
const NODE_SOCKET_URL = NODE_API_URL.replace(/\/api\/?$/, '');

let socket = null;

/**
 * Lazily creates a single shared Socket.IO connection, authenticated with
 * the same JWT the REST clients send as a bearer token (see api/client.js).
 * Reused across pages so navigating between Task Detail / Tasks List
 * doesn't reconnect on every route change.
 */
export function getSocket() {
  if (socket) return socket;

  const token = localStorage.getItem('access_token');
  socket = io(NODE_SOCKET_URL, {
    auth: { token },
    autoConnect: !!token,
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
