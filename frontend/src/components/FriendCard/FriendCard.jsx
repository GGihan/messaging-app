import { chatHelper } from "@/utils/chatHelpers";
import styles from "./FriendCard.module.css";
import Button from "../ui/Button/Button";
import {
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "../ui/DropdownMenu/DropdownMenu";
import moreVert from "@/assets/icons/more-vert.svg";
import { formatLastActive } from "@/utils/formatDate";

export default function FriendCard({ friend }) {

  const handleBlockUser = () => {
    // Block user
  };

  const handleRemoveFriend = () => {
    // Remove friend
  };

  return (
    <div className={`${styles.cardWrapper} flex-column`}>
      <div className={`${styles.main} flex-row`}>
        <div className={styles.avatarWrapper}>
          <img
            className={styles.avatar}
            src={chatHelper.determineUserAvatarUrl(friend.profile?.avatarUrl)}
            alt=""
            aria-hidden="true"
          />
        </div>

        <div className={`${styles.infoGroup} flex-column`}>
          <p className={styles.name}>{friend.profile.displayName}</p>
          
          <p className={styles.status}>{friend.isOnline
            ? "Online"
            : formatLastActive(friend.lastActiveAt)}
          </p>
        </div>

        <div className={`${styles.dropdown} flex-row`}>
          <DropdownMenuRoot>
            <DropdownMenuTrigger asChild>
              <Button
                className={styles.actionButton}
                aria-label="Friend options"
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
              <>
                <DropdownMenuItem onSelect={handleBlockUser}>
                  Block user
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                  
                <DropdownMenuItem variant="danger" onSelect={handleRemoveFriend}>
                  Remove friend
                </DropdownMenuItem>
              </>
            </DropdownMenuContent>
          </DropdownMenuRoot>
        </div>
      </div>

      <div className={`${styles.bioWrapper} flex-row`}>
        <p className={styles.bio}>{friend.profile?.bio}</p>
      </div>
    </div>
  );
};