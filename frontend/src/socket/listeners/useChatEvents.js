import { useSocketEvent } from "../useSocketEvent";
import { useChatStore } from "@/store/useChatStore";
import { useChatMessages } from "@/hooks/useChatMessages";

export default function useChatEvents(socket) {
  const activeChatId = useChatStore((state) => state.activeChatId);
  const { refetchMessages } = useChatMessages(activeChatId);
  
  useSocketEvent(socket, 'chat_message', (incomingMessage) => {
      if (incomingMessage.chatId !== activeChatId) return;
  
      refetchMessages(
        (pages = []) => {
          if (!pages.length) return pages;
  
          const [firstPage, ...restPages] = pages;
  
          return [
            {
              ...firstPage,
              messages: [...firstPage.messages, incomingMessage],
            },
            ...restPages,
          ];
        },
        { revalidate: false }
      );
    });
}