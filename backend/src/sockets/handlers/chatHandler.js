import { chatService } from "../../services/chatService.js";

export const registerChatHandlers = (io, socket) => {
  const userId = socket.user.id;

  socket.on('chat_open', async (chatId) => {
    if (!chatId) return;

    try {
      const isActiveMember = await chatService.getActiveMembership(chatId, userId);
      if (!isActiveMember) return;
      
      socket.join(`chat:${chatId}`);

      // Update read status 
      const now = new Date();
      await chatService.markChatAsRead(chatId, userId, now);

      // Notify the room that this user caught up
      socket.to(`chat:${chatId}`).emit('chat_read', {
        chatId,
        userId,
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

  socket.on('chat_read', async ({ chatId }) => {
    if (!chatId) return;

    try {
      const isActiveMember = await chatService.getActiveMembership(chatId, userId);
      if (!isActiveMember) return;

      const now = new Date();
      await chatService.markChatAsRead(chatId, userId, now);

      socket.to(`chat:${chatId}`).emit('chat_read', {
        chatId,
        userId,
        lastReadAt: now.toISOString(),
      });
    } catch (error) {
      console.error(`Error updating read status in chat ${chatId}:`, error);
    }
  });
};