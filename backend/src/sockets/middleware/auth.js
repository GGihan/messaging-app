import configuredPassport from '../../config/passport.js';
import { sessionMiddleware } from '../../config/session.js';

// Bridge standard Express middleware to Socket.IO's internal request
const wrap = (middleware) => (socket, next) => middleware(socket.request, {}, next);

export const registerSocketAuth = (io) => {
  io.use(wrap(sessionMiddleware));

  io.use(wrap(configuredPassport.initialize()));
  io.use(wrap(configuredPassport.session()));

  // Authenticate the socket
  io.use((socket, next) => {
    const user = socket.request.user;

    if (!user) {
      return next(new Error('Unauthorized: No active session found'));
    }

    socket.user = user; // Attach user directly to socket instance
    return next();
  });
};