import { getIO } from "../socket.js";

export const messageEmitter = {
  newMessage(chatId, message) {
    const io = getIO();
    io.to(`chat:${chatId}`).emit('chat_message', message);
  },
};
