import { Link } from "react-router";
import TopAppBar from "../TopAppBar/TopAppBar";
import styles from "./ChatsList.module.css";
import chatAdd from "@/assets/icons/chat-add.svg";
import useSWR from "swr";
import { apiClient } from "@/config/api";
import LoadingSpinner from "../ui/LoadingSpinner/LoadingSpinner";
import ChatCard from "../ChatCard/ChatCard";
import SearchBar from "../ui/SearchBar/SearchBar";
import { useState } from "react";
import { chatHelper } from "@/utils/chatHelpers";
import { useAuth } from "@/hooks/useAuth";
import { socket } from "@/config/socket";
import { useSocketEvent } from "@/hooks/useSocketEvent";

const chatFetcher = (url) => apiClient(url).then(res => res.data.chats);

export default function ChatsList() {
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  
  const {
    data: chats,
    error: chatsError,
    isLoading: isLoadingChats,
    mutate: refetchChats,
  } = useSWR(
    `/chats`,
    chatFetcher,
    {
      revalidateOnFocus: false,
    }
  );

  useSocketEvent(socket, 'chat_message', () => {
    refetchChats();
  });

  // Client-side filtering in memory:
  const filteredChats = chats?.filter((chat) => {
    const { name: chatName } = chatHelper.determineChatName(chat, user.id);
    const name = chatName || "";
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (chatsError) return <div>{chatsError.message || "Failed to load chats."}</div>;
    
  if (isLoadingChats) {
    return (
      <div 
        className="loading-container"
      >
        <LoadingSpinner size={40} />
      </div>
    );
  };

  return (
    <div className={`${styles.tabWrapper} flex-column`}>
      <TopAppBar 
        title={"Chats"}
        actions={
          <Link to="/chats/new" className={styles.linkButton} aria-label="Add new chat">
            <img
              className={styles.linkIcon}
              src={chatAdd}
              alt=""
              width="24"
              height="24"
              aria-hidden="true"
            />
          </Link>
        }
      />
      <div className={`${styles.content} flex-column`}>
        <SearchBar
          placeholder="Filter your chats..."
          onSearch={setSearchQuery}
          debounceMs={0}
        />
        <div className={`${styles.list} flex-column`}>
          {filteredChats.map((chat) => (
            <ChatCard key={chat.id} chat={chat} />
          ))}
        </div>
      </div>
    </div>
  );
};