import toast from "react-hot-toast";
import { useSocketEvent } from "../useSocketEvent";
import { mutate } from "swr";

export function useFriendshipEvents(socket) {
  useSocketEvent(socket, 'friend_request:received', (friendship) => {
    toast(`Friend request from ${friendship?.sender?.profile?.displayName}!`);
    
    mutate(['/friendships', {status: 'PENDING', type: 'incoming'}]);
  });

  useSocketEvent(socket, 'friend_request:accepted', (friendship) => {
    toast.success(`${friendship?.receiver?.profile?.displayName} accepted your request!`);

    mutate(['/friendships', { status: 'ACCEPTED' }]);
  });
};