import { getIO } from "../socket.js";

export const friendshipEmitter = {
  emitFriendshipRequested(receiverId, friendship) {
    if (!receiverId || !friendship) return;

    const userRoom = `user:${receiverId}`;
    
    getIO().to(userRoom).emit('friend_request:received', friendship);
  },

  emitFriendshipAccepted(friendship) {
    if (!friendship) return;

    const userRoom = `user:${friendship.senderId}`;
    
    getIO().to(userRoom).emit('friend_request:accepted', friendship);
  },
};