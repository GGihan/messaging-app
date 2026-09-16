import { chatService } from "../../services/chatService.js";

export const registerChatHandlers = (io, socket) => {
  socket.on('chat_open', async (chatId) => {
    if (!chatId) return;

    try {
      const isActiveMember = await chatService.getActiveMembership(chatId, socket.user.id);
      if (!isActiveMember) return;
      
      socket.join(`chat:${chatId}`);

      // Update read status 
      const now = new Date();
      await chatService.markChatAsRead(chatId, socket.user.id, now);

      // Notify the room that this user caught up
      socket.to(`chat:${chatId}`).emit('chat_read', {
        chatId,
        userId: socket.user.id,
        lastReadAt: now.toISOString(),
      });
    } catch (error) {
      console.error('Error opening chat:', error);
    }
  });

  socket.on('chat_close', async (chatId) => {
    if (!chatId) return;

    socket.leave(`chat:${chatId}`);
  });
};