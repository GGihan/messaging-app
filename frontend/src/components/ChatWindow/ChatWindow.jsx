import styles from "./ChatWindow.module.css";
import TopAppBar from "../TopAppBar/TopAppBar";
import Button from "../ui/Button/Button";
import arrowLeft from "@/assets/icons/arrow-left.svg";
import moreVert from "@/assets/icons/more-vert.svg";
import { useChatStore } from "@/store/useChatStore";
import {
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "../ui/DropdownMenu/DropdownMenu";

export default function ChatWindow() {
  const activeChatId = useChatStore((state) => state.activeChatId);
  const closeChat = useChatStore((state) => state.closeChat);

  const handleBlockUser = () => {
    // post request for user block
    console.log("Block user for chatId:", activeChatId);
  };

  const handleRemoveChat = () => {
    // delete request for chat removal
    console.log("Remove chat history for chatId:", activeChatId);
    closeChat();
  };

  // fetch chat data here useSWR

  if (!activeChatId) return null;

  return (
    <div className={styles.windowWrapper}>
      <TopAppBar
        title={"name placeholder"}
        leading={
          <Button
            className={styles.actionButton}
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
        actions={
          <DropdownMenuRoot>
            <DropdownMenuTrigger asChild>
              <Button
                className={styles.actionButton}
                aria-label="Chat options"
              >
                <img
                  className={styles.buttonIcon}
                  src={moreVert}
                  alt=""
                  width="24"
                  height="24"
                  aria-hidden="true"
                />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent>
              <DropdownMenuItem onSelect={handleBlockUser}>
                Block user
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem variant="danger" onSelect={handleRemoveChat}>
                Remove chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenuRoot>
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