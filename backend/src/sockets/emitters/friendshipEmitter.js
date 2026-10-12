import { getIO } from "../socket.js";

export const friendshipEmitter = {
  emitFriendshipRequested(receiverId, friendship) {
    if (!receiverId || !friendship) return;

    const userRoom = `user:${receiverId}`;
    
    getIO().to(userRoom).emit('friend_request:received', friendship);
  },
};