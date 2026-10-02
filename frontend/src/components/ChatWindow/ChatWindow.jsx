import styles from "./ChatWindow.module.css";
import TopAppBar from "../TopAppBar/TopAppBar";
import Button from "../ui/Button/Button";
import arrowLeft from "@/assets/icons/arrow-left.svg";
import membersIcon from "@/assets/icons/members.svg";
import moreVert from "@/assets/icons/more-vert.svg";
import personAddIcon from "@/assets/icons/person-add.svg";
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
import EditGroup from "../EditGroup/EditGroup";
import AddMember from "../AddMember/AddMember";

const chatFetcher = (url) => apiClient(url).then(res => res.data.chat);

export default function ChatWindow() {
  const { user } = useAuth();
  const activeChatId = useChatStore((state) => state.activeChatId);
  const closeChat = useChatStore((state) => state.closeChat);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showMemberList, setShowMemberList] = useState(false);
  const [showEditGroup, setShowEditGroup] = useState(false);

  const handleShowAddMember = () => {
    setShowAddMember(showAddMember ? false : true);
    setShowMemberList(false);
    setShowEditGroup(false);
  };

  const handleShowMemberList = () => {
    setShowMemberList(showMemberList ? false : true);
    setShowAddMember(false);
    setShowEditGroup(false);
  };

  const handleEditGroup = () => {
    setShowEditGroup(showEditGroup ? false : true);
    setShowAddMember(false);
    setShowMemberList(false);
  };

  const handleBlockUser = () => {
    // post request for user block
    console.log("Block user for chatId:", activeChatId);
  };

  const handleRemoveChat = () => {
    // delete request for chat removal
    console.log("Remove chat history for chatId:", activeChatId);
    closeChat();
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
    mutate: refetchChat,
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
        className={styles.appBar}
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
            {isGroup && isMember && isAdmin && (
              <Button
                className={styles.actionButton}
                onClick={handleShowAddMember}
                aria-label="Show add member"
              >
                <img
                  className={styles.buttonIcon}
                  src={personAddIcon}
                  alt=""
                  width="24"
                  height="24"
                  aria-hidden="true"
                />
              </Button>
            )}

            {isGroup && isMember && (
              <Button
                className={styles.actionButton}
                onClick={handleShowMemberList}
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
        <MemberList chat={chat} onClose={() => setShowMemberList(false)} refetchChat={refetchChat} />
      )}

      {/* EditGroup */}
      {showEditGroup && (
        // maybe dont refetch chat manually, instead use sockets to update chat info
        <EditGroup chat={chat} onClose={() => setShowEditGroup(false)} refetchChat={refetchChat} />
      )}

      {showAddMember && (
        // maybe dont refetch chat manually, instead use sockets to update chat info
        <AddMember chat={chat} onClose={() => setShowAddMember(false)} refetchChat={refetchChat} />
      )}
    </div>
  );
};