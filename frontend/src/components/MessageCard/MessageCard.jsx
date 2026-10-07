import { useAuth } from "@/hooks/useAuth";
import styles from "./MessageCard.module.css";
import { chatHelper } from "@/utils/chatHelpers";

export default function MessageCard({ message, isGroup }) {
  const { user } = useAuth();

  const { avatarUrl, name, imageUrl, text, time } = chatHelper.getMessageInfo(message);
  const isSenderMe = message.sender.id === user.id

  return (
    <div className={`${styles.cardWrapper} ${isSenderMe ? styles.isMe : ""} flex-row`}>
      {isGroup && !isSenderMe &&
        <div className={styles.avatarWrapper}>
          <img
            className={styles.avatar}
            src={avatarUrl}
            width={300}
            height={300}
            alt=""
            aria-hidden="true"
          />
        </div>
      }

      <div className={`${styles.content} ${isSenderMe ? styles.isMeContent : ""} flex-column`}>
        {isGroup && !isSenderMe &&
          <p className={styles.name}>{name}</p>
        }

        {imageUrl &&
          <div className={`${styles.imageWrapper} flex-column`}>
            <img
              className={styles.image}
              src={imageUrl}
              width={1200}
              height={1200}
              alt=""
              aria-hidden="true"
            />
          </div>
        }

        <p className={styles.text}>{text}</p>

        <p className={styles.time}>{time}</p>
      </div>
    </div>
  );
};