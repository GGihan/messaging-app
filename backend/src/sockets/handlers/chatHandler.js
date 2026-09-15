import { chatService } from "../../services/chatService.js";

export const registerChatHandlers = (io, socket) => {
  socket.on('open_chat', async (chatId) => {
    if (!chatId) return;

    try {
      const isActiveMember = await chatService.getActiveMembership(chatId, socket.user.id);

      if (!isActiveMember) return;
      
      socket.join(`chat:${chatId}`);
    } catch (error) {
      console.error('Error verifying chat membership:', error);
    }
  });

  socket.on('close_chat', async (chatId) => {
    if (!chatId) return;

    socket.leave(`chat:${chatId}`);
  });
};