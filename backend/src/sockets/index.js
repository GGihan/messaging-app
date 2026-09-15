import { Server } from 'socket.io';
import { corsOptions } from '../config/cors.js';
import { registerSocketAuth } from './middleware/auth.js';
import { registerPresenceHandlers } from './handlers/presenceHandler.js';

let io = null;

export const initSocketServer = (server) => {
  io = new Server(server, {
    cors: corsOptions,
  });

  // Attach handshake authentication
  registerSocketAuth(io);

  // Bind handlers on successful connection
  io.on('connection', (socket) => {
    registerPresenceHandlers(io, socket);
    // registerChatHandlers(io, socket);
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io has not been initialized yet!');
  }
  return io;
};