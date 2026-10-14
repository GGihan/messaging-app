import { chatHelper } from "@/utils/chatHelpers";
import styles from "./ChatCard.module.css";
import { useAuth } from "@/hooks/useAuth";
import Button from "../ui/Button/Button";
import { useChatStore } from "@/store/useChatStore";
import imageIcon from "@/assets/icons/image.svg";
import doubleCheckIcon from "@/assets/icons/double-check.svg";

export default function ChatCard({ chat }) {
  const { user } = useAuth();
  const setActiveChat = useChatStore((state) => state.setActiveChat);
  const activeChatId = useChatStore((state) => state.activeChatId);

  const { avatarUrl, name, message, sender, date, isRead, isSenderMe } = chatHelper.getChatCardInfo(chat, user.id);
  const isActiveChat = chat?.id === activeChatId;

  return (
    <div className={`${styles.cardWrapper} flex-row`}>
      <div className={`${styles.startGroup} flex-row`}>
        <div className={`${styles.avatarWrapper} flex-column`}>
          <img
            className={styles.avatar}
            src={avatarUrl}
            alt=""
            aria-hidden="true"
          />
        </div>

        <div className={`${styles.infoGroup} flex-column`}>
          <p className={styles.name}>{name}</p>
          <div className={`${styles.messageGroup} flex-row`}>
            {sender &&
              <p className={styles.sender}>{sender}:</p>
            }
            {isSenderMe &&
              <img
                className={`${styles.icon} ${isRead ? styles.blueCheckmark : ""}`}
                src={doubleCheckIcon}
                alt=""
                width="18"
                height="18"
                aria-hidden="true"
              />
            }
            <div className={`${styles.message} flex-row`}>
              {message?.imageUrl &&
                <div className={`${styles.imageWrapper} flex-column`}>
                  <img
                    className={styles.image}
                    src={imageIcon}
                    width={20}
                    height={20}
                    alt=""
                    aria-hidden="true"
                  />
                </div>
              }
              <p className={styles.text}>{message.text}</p>
            </div>
          </div>
        </div>
      </div>

      <div className={`${styles.endGroup} flex-column`}>
        <p className={styles.date}>{date}</p>
      </div>

      <Button
        className={`${styles.overlayButton} ${isActiveChat ? styles.selectedChat : ""}`}
        onClick={() => setActiveChat(chat.id)}
        aria-label={`Open chat with ${name}`}
      />
    </div>
  );
};