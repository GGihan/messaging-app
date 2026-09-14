import { getIO } from "..";
import { findAllAcceptedFriendIds } from "../../services/friendshipService";

export const emitPresenceToFriends = async (userId, status, lastActiveAt = null) => {
  try {
    const friendIds = await findAllAcceptedFriendIds(userId);

    if (friendIds.length > 0) {
      const io = getIO();
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