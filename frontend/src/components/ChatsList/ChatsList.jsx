import { Link } from "react-router";
import TopAppBar from "../TopAppBar/TopAppBar";
import Button from "../ui/Button/Button";
import styles from "./ChatsList.module.css";
import chatAdd from "@/assets/icons/chat-add.svg";
import search from "@/assets/icons/search.svg";
import { useChatStore } from "@/store/useChatStore";

export default function ChatsList() {
  const activeChatId = useChatStore((state) => state.activeChatId);
  const setActiveChat = useChatStore((state) => state.setActiveChat);

  // fetch chats here useSWR

  const handleSearch = () => {
    // filter chats here
  };

  // onClick={() => setActiveChat(chat.id)} for selecting chat

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
        <div className={styles.list}>
          {/* chats.map(chat => <ChatCard key={chat.id} chat={chat} />) */}
          <div>
            <h2>some chat1</h2>
            <p>message</p>
            <Button
              className={styles.backButton}
              onClick={() => setActiveChat("09d317d3-5be4-4e4f-ac18-575052f806f6")}
              aria-label="Back to chats"
            >
              <img
                className={styles.buttonIcon}
                src={search}
                alt=""
                width="24"
                height="24"
                aria-hidden="true"
              />
            </Button>
          </div>
          <div>
            <h2>some chat2</h2>
            <p>message</p>
          </div>
          <div>
            <h2>some chat3</h2>
            <p>message</p>
          </div>
          <div>
            <h2>more chats</h2>
            <p>message</p>
          </div>
          <div>
            <h2>some chat</h2>
            <p>message</p>
          </div>
          <div>
            <h2>some chat</h2>
            <p>message</p>
          </div>
          <div>
            <h2>some chat</h2>
            <p>message</p>
          </div>
          <div>
            <h2>some chat</h2>
            <p>message</p>
          </div>
          <div>
            <h2>some chat</h2>
            <p>message</p>
          </div>
          <div>
            <h2>some chat</h2>
            <p>message</p>
          </div>
          <div>
            <h2>some chat</h2>
            <p>message</p>
          </div>
          <div>
            <h2>some chat</h2>
            <p>message</p>
          </div>
          <div>
            <h2>some chat</h2>
            <p>message</p>
          </div>
          <div>
            <h2>some chat</h2>
            <p>message</p>
          </div>
          <div>
            <h2>some chat</h2>
            <p>message</p>
          </div>
          <div>
            <h2>some chat</h2>
            <p>message</p>
          </div>
        </div>
      </div>
    </div>
  );
};