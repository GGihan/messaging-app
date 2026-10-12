import { useAuth } from "@/hooks/useAuth";
import { socket } from "@/socket/config/socket";
import { useEffect } from "react";
import { useFriendshipEvents } from "./listeners/useFriendshipEvents";
import useChatEvents from "./listeners/useChatEvents";

export function SocketSubscriptionProvider({ children }) {
  const { user } = useAuth();

  // Connecting and disconnecting authenticated user
  useEffect(() => {
    if (!user) {
      socket.disconnect();
      return;
    }

    socket.connect();

    return () => {
      socket.disconnect();
    };
  }, [user]);

  // Binding global socket listeners
  useFriendshipEvents(socket);
  useChatEvents(socket);

  return children;
};