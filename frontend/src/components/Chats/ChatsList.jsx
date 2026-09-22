import Button from "../ui/Button/Button";
import styles from "./ChatsList.module.css";
import chatAdd from "@/assets/icons/chat-add.svg";

export default function ChatsList() {

  // fetch chats here useSWR

  const handleAddChat = () => {
    // Open new chat modal or navigate to user picker
  };

  return (
    <div className={styles.tabWrapper}>
      <TopAppBar 
        title="Chats"
        actions={
          <Button className={styles.addChat} onClick={handleAddChat} aria-label="Add new chat">
            <img
                className={styles.linkIcon}
                src={chatAdd}
                alt=""
                width="24"
                height="24"
                aria-hidden="true"
              />
          </Button>
        }
      />
      <div className={styles.list}>
        {/* chats.map(chat => <ChatCard key={chat.id} chat={chat} />) */}
      </div>
    </div>
  );
};