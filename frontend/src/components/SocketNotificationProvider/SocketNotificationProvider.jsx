import { socket } from "@/config/socket";
import { useSocketEvent } from "@/hooks/useSocketEvent";
import toast from "react-hot-toast";
import { mutate } from "swr";

export function SocketNotificationProvider({ children }) {
  useSocketEvent(socket, 'friend_request:received', (friendship) => {
    toast.success(`Friend request from ${friendship.sender.profile.displayName}!`);

    mutate(['/friendships', {status: 'PENDING', type: 'incoming'}]);
  });

  return children;
};