import styles from "./FriendsList.module.css";
import { useState } from "react";
import TopAppBar from "../TopAppBar/TopAppBar";
import friendAdd from "@/assets/icons/person-add.svg";
import inboxIcon from "@/assets/icons/inbox.svg";
import { Link } from "react-router";
import SearchBar from "../ui/SearchBar/SearchBar";
import LoadingSpinner from "../ui/LoadingSpinner/LoadingSpinner";
import FriendCard from "../FriendCard/FriendCard";
import { useFriendships } from "@/hooks/useFriendships";

export default function FriendsList() {
  const [searchQuery, setSearchQuery] = useState("");

  const { friendships: activeFriendships, friendshipsError, isLoadingFriendships } 
    = useFriendships({ status: 'ACCEPTED'});

  const { friendships: pendingFriendships } 
    = useFriendships({ status: 'PENDING', type: 'incoming'});

  // Client-side filtering in memory:
  const filteredFriendships = activeFriendships?.filter((friendship) => {
    const name = friendship.friend.profile.displayName || "";
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (friendshipsError) return <div>{friendshipsError.message || "Failed to load friendships."}</div>;
    
  if (isLoadingFriendships) {
    return (
      <div 
        className="loading-container"
      >
        <LoadingSpinner size={40} />
      </div>
    );
  };

  return (
    <div className={`${styles.tabWrapper} flex-column`}>
      <TopAppBar 
        title={"Friends"}
        actions={
          <>
            <Link
              to="/friends/requests"
              className={styles.linkButton}
              aria-label="Open friend requests"
            >
              <img
                className={styles.linkIcon}
                src={inboxIcon}
                alt=""
                width="24"
                height="24"
                aria-hidden="true"
              />
              {pendingFriendships.length >= 1 &&
                <span className={styles.badge}>{pendingFriendships.length}</span>
              }
            </Link>
            <Link
              to="/friends/new"
              className={styles.linkButton}
              aria-label="Add new friend"
            >
              <img
                className={styles.linkIcon}
                src={friendAdd}
                alt=""
                width="24"
                height="24"
                aria-hidden="true"
              />
            </Link>
          </>
        }
      />
      <div className={`${styles.content} flex-column`}>
        <SearchBar
          placeholder="Filter your friends..."
          onSearch={setSearchQuery}
          debounceMs={0}
        />
        <div className={`${styles.list} flex-column`}>
          {filteredFriendships.map((friendship) => (
            <FriendCard key={friendship.id} friendship={friendship} />
          ))}
        </div>
      </div>
    </div>
  );
};