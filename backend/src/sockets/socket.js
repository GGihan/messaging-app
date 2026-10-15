import { Server } from 'socket.io';
import { corsOptions } from '../config/cors.js';
import { registerSocketAuth } from './middleware/auth.js';
import { registerPresenceHandlers } from './handlers/presenceHandler.js';
import { registerChatHandlers } from './handlers/chatHandler.js';

let io = null;

export const initSocketServer = (server) => {
  io = new Server(server, {
    cors: corsOptions,
    transports: ['websocket'],
  });

  // Attach handshake authentication
  registerSocketAuth(io);

  // Bind handlers on successful connection
  io.on('connection', (socket) => {
    registerPresenceHandlers(io, socket);
    registerChatHandlers(io, socket);
  });

  return io;
};

// Setting IO for mockIO testing
export const setIO = (instance) => {
  io = instance;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io has not been initialized yet!');
  }
  return io;
};