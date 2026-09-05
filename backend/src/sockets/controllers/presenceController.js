import { prisma } from '../../../lib/prisma.js';
import { findAllAcceptedFriendIds } from '../../services/friendshipService.js';
import { presenceService } from '../../services/presenceService.js';

const broadcastPresenceToFriends = async (io, userId, status, lastActiveAt = null) => {
  try {
    const friendIds = await findAllAcceptedFriendIds(userId);

    if (friendIds.length > 0) {
      const friendRooms = friendIds.map((id) => `user:${id}`);
      io.to(friendRooms).emit('friend_status_change', {
        userId,
        status,
        lastActiveAt,
      });
    }
  } catch (error) {
    console.error(`Error notifying friends for ${userId}:`, error);
  }
};

export const handleConnect = async (io, socket) => {
  const userId = socket.user.id;
  socket.join(`user:${userId}`);

  const becameOnline = presenceService.addConnection(userId, socket.id);
  if (becameOnline) {
    broadcastPresenceToFriends(io, userId, 'online');
  }
};

export const handleDisconnect = async (io, socket) => {
  const userId = socket.user.id;
  const becameOffline = presenceService.removeConnection(userId, socket.id); 

  if (becameOffline) {
    const now = new Date();
    
    await prisma.user.update({
      where: { id: userId },
      data: { lastActiveAt: now },
    });

    if (!presenceService.isUserOnline(userId)) {
      broadcastPresenceToFriends(io, userId, 'offline', now.toISOString());
    }
  }
};