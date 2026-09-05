import { handleConnect, handleDisconnect } from "../controllers/presenceController.js";

export const registerPresenceHandlers = (io, socket) => {
  handleConnect(io, socket);

  socket.on('disconnect', () => {
    handleDisconnect(io, socket);
  });
};