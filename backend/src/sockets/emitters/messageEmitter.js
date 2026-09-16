import { chatService } from "../../services/chatService.js";
import { getIO } from "../socket.js";

export const messageEmitter = {
  async newMessage(chatId, message) {
    const io = getIO();
    const roomName = `chat:${chatId}`;

    io.to(roomName).emit('chat_message', message);

    const socketsInRoom = await io.in(roomName).fetchSockets?.();
    if (!socketsInRoom || socketsInRoom.length === 0) return;

    // All active users, excluding the current user
    const activeUserIds = new Set(); 
    for (const socket of socketsInRoom) {
      if (socket.user?.id && socket.user.id !== message.senderId) {
        activeUserIds.add(socket.user.id);
      }
    }
    if (activeUserIds.size === 0) return;

    // Updating lastActiveAt of chatMembers
    const userIdsArray = Array.from(activeUserIds);
    const readTimestamp = message.createdAt ? new Date(message.createdAt) : new Date();

    try {
      await chatService.markChatAsReadForUsers(chatId, userIdsArray, readTimestamp);

      // Notify room members so clients can update their read receipts
      io.to(roomName).emit('chat_read_bulk', {
        chatId,
        userIds: userIdsArray,
        lastReadAt: readTimestamp.toISOString(),
      });
    } catch (err) {
      console.error('Failed to update read status for active viewers:', err);
    }
  },
};
