import { chatService } from "../../services/chatService.js";
import { getIO } from "../socket.js";

export const messageEmitter = {
  async newMessage(chatId, senderId, message) {
    const receiverIds = await chatService.getReceiverMemberIds(chatId, senderId);
    if (!receiverIds.length) return;

    const userRooms = receiverIds.map((id) => `user:${id}`);
    
    getIO().to(userRooms).emit('chat_message', message);
  },
};
