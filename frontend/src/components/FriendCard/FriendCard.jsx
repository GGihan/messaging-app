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
import { apiClient } from "@/config/api";
import toast from "react-hot-toast";
import { mutate } from "swr";

export default function FriendCard({ friendship }) {
  const friend = friendship?.friend;
  const friendshipId = friendship?.id;

  const handleBlockUser = async () => {
    const receiverId = friend?.id;

    try {
      await mutate(
        ['/friendships', { status: 'ACCEPTED' }],
        () =>
          apiClient(`/friendships/block`, {
            method: 'POST',
            body: JSON.stringify({ receiverId })
          }),
        {
          optimisticData: (friendships = []) =>
            friendships.filter((friendship) => friendship.id !== friendshipId),
          populateCache: false,
          rollbackOnError: true,
          revalidate: true,
        }
      );
    } catch (error) {
      toast.error(error.message || 'Could not block user');
    }
  };

  const handleRemoveFriend = async () => {
    try {
      await mutate(
        ['/friendships', { status: 'ACCEPTED' }],
        () =>
          apiClient(`/friendships/${friendship.id}`, {
            method: 'DELETE',
            body: JSON.stringify({ friendshipId: friendship.id })
          }),
        {
          optimisticData: (friendships = []) =>
            friendships.filter((friendship) => friendship.id !== friendshipId),
          populateCache: false,
          rollbackOnError: true,
          revalidate: true,
        }
      );
    } catch (error) {
      toast.error(error.message || 'Could not delete friendship');
    }
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