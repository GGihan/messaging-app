// Keeps track of multiple tabs
const activeConnections = new Map();

export const presenceService = {
  addConnection(userId, socketId) {
    const isFirst = !activeConnections.has(userId);
    if (isFirst) {
      activeConnections.set(userId, new Set());
    }
    activeConnections.get(userId).add(socketId);
    return isFirst;
  },

  removeConnection(userId, socketId) {
    const userSockets = activeConnections.get(userId);
    if (!userSockets) return false;

    userSockets.delete(socketId);

    if (userSockets.size === 0) {
      activeConnections.delete(userId);
      return true;
    }

    return false;
  },

  isUserOnline(userId) {
    return activeConnections.has(userId);
  },
};