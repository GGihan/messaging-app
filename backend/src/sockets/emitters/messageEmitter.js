import { getIO } from "../socket.js";

export const messageEmitter = {
  newMessage (chatId, message) {
    getIO().to(`chat:${chatId}`).emit('chat_message', message);
  },
};
