import styles from "./ChatWindow.module.css";
import TopAppBar from "../TopAppBar/TopAppBar";
import Button from "../ui/Button/Button";
import arrowLeft from "@/assets/icons/arrow-left.svg";
import membersIcon from "@/assets/icons/members.svg";
import moreVert from "@/assets/icons/more-vert.svg";
import { useChatStore } from "@/store/useChatStore";
import {
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "../ui/DropdownMenu/DropdownMenu";
import { apiClient } from "@/config/api";
import useSWR from "swr";
import { useAuth } from "@/hooks/useAuth";
import { chatHelper } from "@/utils/chatHelpers";
import LoadingSpinner from "../ui/LoadingSpinner/LoadingSpinner";
import { useState } from "react";
import MemberList from "../Member/MemberList/MemberList";

const chatFetcher = (url) => apiClient(url).then(res => res.data.chat);

export default function ChatWindow() {
  const { user } = useAuth();
  const activeChatId = useChatStore((state) => state.activeChatId);
  const closeChat = useChatStore((state) => state.closeChat);
  const [showMemberList, setShowMemberList] = useState(false);

  const handleBlockUser = () => {
    // post request for user block
    console.log("Block user for chatId:", activeChatId);
  };

  const handleRemoveChat = () => {
    // delete request for chat removal
    console.log("Remove chat history for chatId:", activeChatId);
    closeChat();
  };

  const handleEditGroup = () => {
    // Open Modal or similiar for Group Edit
    console.log("Edit chat for chatId:", activeChatId);
  };

  const handleDeleteGroup = () => {
    // delete request for group chat
    closeChat();
  };

  const handleLeaveGroup = () => {
    // delete member request for group chat
     console.log("delete member for chatId:", activeChatId);
  };

  const {
    data: chat,
    error: chatError,
    isLoading: isLoadingChat,
  } = useSWR(
    `/chats/${activeChatId}`,
    chatFetcher,
    {
      revalidateOnFocus: false,
    }
  );

  if (!activeChatId) return null;
  if (chatError) return <div>{chatError.message || "Failed to load chat."}</div>;
  
  if (isLoadingChat) {
    return (
      <div 
        className="loading-container"
        style={{
          height: "100%",
        }}
      >
        <LoadingSpinner size={40} />
      </div>
    );
  }

  const { avatarUrl, title, subtitle } = chatHelper.getChatBarInfo(chat, user.id);
  const { isGroup, isMember, isAdmin } = chatHelper.getChatPermissions(chat, user.id);

  return (
    <div className={styles.windowWrapper}>
      <TopAppBar
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
        avatarUrl={avatarUrl}
        title={title}
        subtitle={subtitle}
        actions={
          <>
            {isGroup && (
              <Button
                className={styles.actionButton}
                onClick={() => setShowMemberList(showMemberList ? false : true)}
                aria-label="Show member list"
              >
                <img
                  className={styles.buttonIcon}
                  src={membersIcon}
                  alt=""
                  width="24"
                  height="24"
                  aria-hidden="true"
                />
              </Button>
            )}

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
                {isGroup ? (
                  // Group chat
                  <>
                    {isMember && (
                      <>
                        {isAdmin && (
                          <>
                            <DropdownMenuItem onSelect={handleEditGroup}>
                              Edit group
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem variant="danger" onSelect={handleDeleteGroup}>
                              Delete group
                            </DropdownMenuItem>
                          </>
                        )}

                        <DropdownMenuItem variant="danger" onSelect={handleLeaveGroup}>
                          Leave group
                        </DropdownMenuItem>
                      </>
                    )} 
                    <DropdownMenuItem variant="danger" onSelect={handleRemoveChat}>
                      Remove chat
                    </DropdownMenuItem>
                  </>
                ) : (
                  // Direct chat
                  <>
                    <DropdownMenuItem onSelect={handleBlockUser}>
                      Block user
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem variant="danger" onSelect={handleRemoveChat}>
                      Remove chat
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenuRoot>
          </>
        }
      />

      <div className={styles.messages}>
        {/* add message component here */}
        <p>Message component placeholder</p>
      </div>
      
      <div className={styles.composer}>
        <input type="text" placeholder="Type a message..." />
      </div>

      {/* MemberList */}
      {showMemberList && (
        <MemberList members={chat.members} onClose={() => setShowMemberList(false)} />
      )}

    </div>
  );
};