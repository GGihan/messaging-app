import { prisma } from "../../../lib/prisma.js";
import { presenceService } from "../../services/presenceService.js";
import { emitPresenceToFriends } from "../emitters/presenceEmitter.js";

const handlePresenceDisconnect = async (userId, socketId) => {
  try {
    const becameOffline = presenceService.removeConnection(userId, socketId);

    if (becameOffline) {
      const now = new Date();

      await prisma.user.update({
        where: { id: userId },
        data: { lastActiveAt: now },
      });

      if (!presenceService.isUserOnline(userId)) {
        await emitPresenceToFriends(userId, 'offline', now.toISOString());
      }
    }
  } catch (error) {
    console.error(`Error handling presence disconnect for ${userId}:`, error);
  }
};

export const registerPresenceHandlers = (io, socket) => {
  const userId = socket.user.id;
  
  // Join user's individual room
  socket.join(`user:${userId}`);

  // Track connection state
  const becameOnline = presenceService.addConnection(userId, socket.id);
  if (becameOnline) {
    emitPresenceToFriends(userId, 'online');
  }

  // Handle disconnection
  socket.on('disconnect', async () => {
    handlePresenceDisconnect(userId, socket.id);
  });
};