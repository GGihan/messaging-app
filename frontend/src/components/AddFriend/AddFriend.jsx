import { Link } from "react-router";
import TopAppBar from "../TopAppBar/TopAppBar";
import styles from "./AddFriend.module.css";
import arrowLeft from "@/assets/icons/arrow-left.svg";
import SearchBar from "../ui/SearchBar/SearchBar";
import { useState } from "react";
import { apiClient } from "@/config/api";
import useSWR from "swr";
import Button from "../ui/Button/Button";
import { chatHelper } from "@/utils/chatHelpers";
import mailSendIcon from "@/assets/icons/mail-send.svg";
import { useFriendships } from "@/hooks/useFriendships";
import toast from "react-hot-toast";

const userSearchFetcher = (url) => apiClient(url).then((res) => res.data.users);

export default function AddFriend() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  const {
    data: users = [],
    error: usersError,
  } = useSWR(
    searchQuery.length >= 1 ? `/users?search=${encodeURIComponent(searchQuery)}` : null,
    userSearchFetcher,
    {
      revalidateOnFocus: false,
      keepPreviousData: true,
    }
  );

  const { friendships, refetchFriendships } = useFriendships({});

  const activeFriendUserIds = new Set();
  for (const f of friendships ?? []) {
    if (f.status !== "DECLINED") {
      activeFriendUserIds.add(f.senderId);
      activeFriendUserIds.add(f.receiverId);
    }
  }

  const handleSendRequest = async (receiverId) => {
    setIsSubmittingRequest(true);
    try {
      await apiClient(`/friendships/requests`, {
        method: 'POST',
        body: JSON.stringify({ receiverId })
      });

      await refetchFriendships();
    } catch (error) {
      toast.error(error.message || 'Could not send request');
    } finally {
      setIsSubmittingRequest(false);
    }
  };
   

  return (
    <div className={`${styles.tabWrapper} flex-column`}>
      <TopAppBar
        className={styles.appBar}
        leading={
          <Link
            className={styles.linkButton}
            to="/friends"
            aria-label="Back to friends"
          >
            <img
              className={styles.linkIcon}
              src={arrowLeft}
              alt=""
              width="24"
              height="24"
              aria-hidden="true"
            />
          </Link>
        }
        title={"Add new friends"}
      />

      <div className={`${styles.content} flex-column`}>
        <SearchBar
          placeholder="Search users..."
          onSearch={setSearchQuery}
          debounceMs={300}
        />

        <div className={`${styles.list} flex-column`}>
          {usersError && (
            <div className={`error-message`}>
              {usersError?.message || "Failed to load users."}
            </div>
          )}

          {users?.map((user) => {
          
            return (
              <div key={user.id} className={`${styles.userCard} flex-row`}>
                <div className={styles.avatarWrapper}>
                  <img
                    className={styles.avatar}
                    src={chatHelper.determineUserAvatarUrl(user.profile?.avatarUrl)}
                    alt=""
                    aria-hidden="true"
                  />
                </div>

                <p className={styles.name}>{user.profile.displayName}</p>

                <Button
                  className={styles.actionButton}
                  onClick={() => handleSendRequest(user.id)}
                  disabled={activeFriendUserIds.has(user.id)}
                  isLoading={isSubmittingRequest}
                >
                  <img
                    className={styles.buttonIcon}
                    src={mailSendIcon}
                    width={24}
                    height={24}
                    alt=""
                    aria-hidden="true"
                  />
                </Button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  );
};