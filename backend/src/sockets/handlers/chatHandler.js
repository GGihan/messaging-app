import { chatService } from "../../services/chatService.js";

export const registerChatHandlers = (io, socket) => {
  const userId = socket.user.id;

  socket.on('chat_read', async (payload) => {
    const chatId = typeof payload === 'object' ? payload?.chatId : payload;
    if (!chatId) return;

    try {
      const isActiveMember = await chatService.getActiveMembership(chatId, userId);
      if (!isActiveMember) return;

      const now = new Date();
      await chatService.markChatAsRead(chatId, userId, now);

      const receiverIds = await chatService.getReceiverMemberIds(chatId, userId);
      if (!receiverIds.length) return;

      const userRooms = receiverIds.map((id) => `user:${id}`);
      io.to(userRooms).emit('chat_read', {
        chatId,
        userId,
        lastReadAt: now.toISOString(),
      });
    } catch (error) {
      console.error(`Error updating read status in chat ${chatId}:`, error);
    }
  });
};