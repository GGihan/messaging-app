import { Link } from "react-router";
import styles from "./FriendRequests.module.css";
import arrowLeft from "@/assets/icons/arrow-left.svg";
import TopAppBar from "../TopAppBar/TopAppBar";
import Button from "../ui/Button/Button";
import { useState } from "react";
import { useFriendships } from "@/hooks/useFriendships";
import { chatHelper } from "@/utils/chatHelpers";
import mailAcceptIcon from "@/assets/icons/mail-mark.svg";
import mailCancelIcon from "@/assets/icons/mail-cancel.svg";
import unblockIcon from "@/assets/icons/unlock.svg";
import toast from "react-hot-toast";
import { apiClient } from "@/config/api";

export default function FriendRequests() {
  const [activePanel, setActivePanel] = useState("incoming");

  const {
    friendships: incomingFriendships,
    refetchFriendships: refetchIncoming,
    friendshipsError: incomingError,
  }
    = useFriendships({ status: "PENDING", type: "incoming" });

  const {
    friendships: outgoingFriendships,
    refetchFriendships: refetchOutgoing,
    friendshipsError: outgoingError,
  }
    = useFriendships({ status: "PENDING", type: "outgoing" });

  const {
    friendships: blockedFriendships,
    refetchFriendships: refetchBlocked,
    friendshipsError: blockedError,
  }
    = useFriendships({ status: "BLOCKED", type: "outgoing" });

  const handleRespondRequest = async (friendshipId, status) => {
    try {
      await refetchIncoming(
        () => 
          apiClient(`/friendships/${friendshipId}`, {
            method: 'PATCH',
            body: JSON.stringify({ status })
          }),
        {
          optimisticData: (current = []) =>
            current.filter((f) => f.id !== friendshipId),
          populateCache: false,
          rollbackOnError: true,
          revalidate: true,
        }
      )
    } catch (error) {
      toast.error(error.message || 'Could not respond to request');
    }
  };

  const handleCancelRequest = async (friendshipId) => {
    try {
      await refetchOutgoing(
        () => 
          apiClient(`/friendships/${friendshipId}`, {
            method: 'DELETE',
          }),
        {
          optimisticData: (current = []) =>
            current.filter((f) => f.id !== friendshipId),
          populateCache: false,
          rollbackOnError: true,
          revalidate: true,
        }
      )
    } catch (error) {
      toast.error(error.message || 'Could not cancel to request');
    }
  };

  const handleUnblockUser = async (receiverId) => {
    try {
      await refetchBlocked(
        () =>
          apiClient(`/friendships/block/${receiverId}`, {
            method: 'DELETE',
          }),
        {
          optimisticData: (current = []) =>
            current.filter((f) => f.receiverId !== receiverId),
          populateCache: false,
          rollbackOnError: true,
          revalidate: true,
        }
      )
    } catch (error) {
      toast.error(error.message || 'Could not unblock user');
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
        title={"Friend requests"}
      />
      
      <div className={`${styles.tabActions} flex-row`}>
        <Button
          className={styles.actionButton}
          onClick={() => setActivePanel("incoming")}
          disabled={activePanel === "incoming"}
          aria-label="Show incoming"
        >
          <p className={styles.buttonText}>incoming</p>
        </Button>
      
        <Button
          className={styles.actionButton}
          onClick={() => setActivePanel("outgoing")}
          disabled={activePanel === "outgoing"}
          aria-label="Show outgoing"
        >
          <p className={styles.buttonText}>outgoing</p>
        </Button>
      
        <Button
          className={styles.actionButton}
          onClick={() => setActivePanel("blocked")}
          disabled={activePanel === "blocked"}
          aria-label="Show blocked"
        >
          <p className={styles.buttonText}>blocked</p>
        </Button>
      </div>

      <div className={`${styles.content} flex-column`}>
        {/* INCOMING REQUESTS */}
        {activePanel === "incoming" && (
          <div className={`${styles.list} flex-column`}>
            {incomingError && (
              <div className={`error-message`}>
                {incomingError?.message || "Failed to load incoming requests."}
              </div>
            )}
  
            {incomingFriendships?.map((friendship) => {
              const sender = friendship?.sender;

              return (
                <div key={friendship.id} className={`${styles.userCard} flex-row`}>
                  <div className={styles.avatarWrapper}>
                    <img
                      className={styles.avatar}
                      src={chatHelper.determineUserAvatarUrl(sender.profile?.avatarUrl)}
                      alt=""
                      aria-hidden="true"
                    />
                  </div>
  
                  <p className={styles.name}>{sender.profile?.displayName}</p>

                  <div className={`${styles.buttonGroup} flex-row`}>
                    <Button
                      className={styles.actionButton}
                      onClick={() => handleRespondRequest(friendship.id, "ACCEPTED")}
                      aria-label="Accept request"
                      title="Accept"
                    >
                      <img
                        className={styles.buttonIcon}
                        src={mailAcceptIcon}
                        width={24}
                        height={24}
                        alt=""
                        aria-hidden="true"
                      />
                    </Button>

                    <Button
                      className={styles.actionButton}
                      onClick={() => handleRespondRequest(friendship.id, "DECLINED")}
                      aria-label="Decline request"
                      title="Decline"
                    >
                      <img
                        className={styles.buttonIcon}
                        src={mailCancelIcon}
                        width={24}
                        height={24}
                        alt=""
                        aria-hidden="true"
                      />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* OUTGOING REQUESTS */}
        {activePanel === "outgoing" && (
          <div className={`${styles.list} flex-column`}>
            {outgoingError && (
              <div className={`error-message`}>
                {outgoingError?.message || "Failed to load outgoing requests."}
              </div>
            )}
  
            {outgoingFriendships?.map((friendship) => {
              const receiver = friendship?.receiver;

              return (
                <div key={friendship.id} className={`${styles.userCard} flex-row`}>
                  <div className={styles.avatarWrapper}>
                    <img
                      className={styles.avatar}
                      src={chatHelper.determineUserAvatarUrl(receiver.profile?.avatarUrl)}
                      alt=""
                      aria-hidden="true"
                    />
                  </div>
  
                  <p className={styles.name}>{receiver.profile?.displayName}</p>

                  <div className={`${styles.buttonGroup} flex-row`}>
                    <Button
                      className={styles.actionButton}
                      onClick={() => handleCancelRequest(friendship.id)}
                      aria-label="Cancel request"
                      title="Cancel"
                    >
                      <img
                        className={styles.buttonIcon}
                        src={mailCancelIcon}
                        width={24}
                        height={24}
                        alt=""
                        aria-hidden="true"
                      />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* BLOCKED */}
        {activePanel === "blocked" && (
          <div className={`${styles.list} flex-column`}>
            {blockedError && (
              <div className={`error-message`}>
                {blockedError?.message || "Failed to load blocked."}
              </div>
            )}
  
            {blockedFriendships?.map((friendship) => {
              const receiver = friendship?.receiver;

              return (
                <div key={friendship.id} className={`${styles.userCard} flex-row`}>
                  <div className={styles.avatarWrapper}>
                    <img
                      className={styles.avatar}
                      src={chatHelper.determineUserAvatarUrl(receiver.profile?.avatarUrl)}
                      alt=""
                      aria-hidden="true"
                    />
                  </div>
  
                  <p className={styles.name}>{receiver.profile?.displayName}</p>

                  <div className={`${styles.buttonGroup} flex-row`}>
                    <Button
                      className={styles.actionButton}
                      onClick={() => handleUnblockUser(receiver.id)}
                      aria-label="Unblock user"
                      title="Unblock"
                    >
                      <img
                        className={styles.buttonIcon}
                        src={unblockIcon}
                        width={24}
                        height={24}
                        alt=""
                        aria-hidden="true"
                      />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  );
};