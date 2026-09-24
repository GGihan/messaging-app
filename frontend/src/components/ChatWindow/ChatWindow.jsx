import styles from "./ChatWindow.module.css";
import TopAppBar from "../TopAppBar/TopAppBar";
import Button from "../ui/Button/Button";
import arrowLeft from "@/assets/icons/arrow-left.svg";
import { useChatStore } from "@/store/useChatStore";

export default function ChatWindow() {
  const activeChatId = useChatStore((state) => state.activeChatId);
  const closeChat = useChatStore((state) => state.closeChat);

  // fetch chat data here useSWR

  if (!activeChatId) return null;

  return (
    <div className={styles.windowWrapper}>
      <TopAppBar
        title={"chat name placeholder"}
        leading={
          <Button
            className={styles.backButton}
            onClick={closeChat}
            aria-label="Back to chats"
          >
            <img
              className={styles.buttonIcon}
              src={arrowLeft}
              alt=""
              width="24"
              height="24"
              aria-hidden="true"
            />
          </Button>
        }
      />

      <div className={styles.messages}>
        {/* add message component here */}
        <p>Message component placeholder</p>
      </div>
      
      <div className={styles.composer}>
        <input type="text" placeholder="Type a message..." />
      </div>
    </div>
  );
};