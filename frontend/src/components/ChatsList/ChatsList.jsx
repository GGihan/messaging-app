import { Link } from "react-router";
import TopAppBar from "../TopAppBar/TopAppBar";
import styles from "./ChatsList.module.css";
import chatAdd from "@/assets/icons/chat-add.svg";
import { useChatStore } from "@/store/useChatStore";
import useSWR from "swr";
import { apiClient } from "@/config/api";
import LoadingSpinner from "../ui/LoadingSpinner/LoadingSpinner";
import ChatCard from "../ChatCard/ChatCard";

const chatFetcher = (url) => apiClient(url).then(res => res.data.chats);

export default function ChatsList() {
  const activeChatId = useChatStore((state) => state.activeChatId);

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

  console.log(chats);

  const handleSearch = () => {
    // filter chats here
  };

  // onClick={() => setActiveChat(chat.id)} for selecting chat

  if (chatsError) return <div>{chatsError.message || "Failed to load chats."}</div>;
    
  if (isLoadingChats) {
    return (
      <div 
        className="loading-container"
        style={{
          height: "100%",
        }}
      >
        <LoadingSpinner size={40} />
      </div>
    );
  }

  return (
    <div className={`${styles.tabWrapper} flex-column`}>
      <TopAppBar 
        title={"Chats"}
        actions={
          <Link to="/chats/new" className={styles.addChat} aria-label="Add new chat">
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
        {/* <SearchBar
          icon={search}
        /> */}
        {/* handleSearch */}
        <div>
          <p>SearchBar</p>
        </div>
        <div className={`${styles.list} flex-column`}>
          {chats.map((chat) => (
            <ChatCard key={chat.id} chat={chat} />
          ))}
        </div>
      </div>
    </div>
  );
};