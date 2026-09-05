import { Server } from 'socket.io';
import { corsOptions } from '../config/cors.js';
import { registerSocketAuth } from './middleware/auth.js';
import { registerPresenceHandlers } from './handlers/presenceHandler.js';

export const initSocketServer = (server) => {
  const io = new Server(server, {
    cors: corsOptions,
  });

  // Attach handshake authentication
  registerSocketAuth(io);

  // Bind handlers on successful connection
  io.on('connection', (socket) => {
    registerPresenceHandlers(io, socket);
    // registerChatRoutes(io, socket);
  });

  return io;
};