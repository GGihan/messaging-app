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
import { mutate } from "swr";
import toast from "react-hot-toast";
import { ChatInput } from "../ui/ChatInput/ChatInput";

const chatFetcher = (url) => apiClient(url).then(res => res.data.chat);

export default function ChatWindow() {
  const { user } = useAuth();
  const activeChatId = useChatStore((state) => state.activeChatId);
  const closeChat = useChatStore((state) => state.closeChat);
  const [activePanel, setActivePanel] = useState(null);

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

  // Tracks previous chat ID to reset during render without an extra paint cycle
  const [prevChatId, setPrevChatId] = useState(activeChatId);
  if (activeChatId !== prevChatId) {
    setPrevChatId(activeChatId);
    setActivePanel(null);
  };

  const togglePanel = (panelName) => {
    setActivePanel((current) => (current === panelName ? null : panelName));
  };

  const handleBlockUser = async () => {
    const otherMember = chat?.members.find((member) => member.user.id !== user.id);
    const otherUser = otherMember?.user;

    closeChat();

    try {
      await apiClient(`/friendships/block`, {
        method: 'POST',
        body: JSON.stringify({ receiverId: otherUser.id})
      });
    } catch (error) {
      toast.error(error.message || 'Could not block user');
    }
  };

  const handleDeleteGroup = async () => {
    const targetId = chat?.id;

    closeChat();

    mutate(
      '/chats',
      (chats = []) => chats.filter((chat) => chat.id !== targetId),
      { revalidate: false } // dont refetch immediatlly
    );

    try {
      await apiClient(`/chats/${targetId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      mutate('/chats');
      toast.error(error.message || 'Could not delete group');
    }
  };

  const handleLeaveGroup = async () => {
    const targetId = chat?.id;

    try {
      await apiClient(`/chats/${targetId}/members/me`, {
        method: 'DELETE',
      });

      refetchChat();
    } catch (error) {
      toast.error(error.message || 'Could not leave group');
    }
  };

  const handleRemoveChat = async () => {
    const targetId = chat?.id;

    closeChat();

    mutate(
      '/chats',
      (chats = []) => chats.filter((chat) => chat.id !== targetId),
      { revalidate: false } // dont refetch immediatlly
    );

    try {
      await apiClient(`/chats/${targetId}/history`, {
        method: 'DELETE',
      });
    } catch (error) {
      mutate('/chats');
      toast.error(error.message || 'Could not remove chat history');
    }
  };

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
    <div className={`${styles.windowWrapper} flex-column`}>
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
                onClick={() => togglePanel("addMember")}
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
                onClick={() => togglePanel("memberList")}
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
                            <DropdownMenuItem onSelect={() => togglePanel("editGroup")}>
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

      <div className={`${styles.content} flex-column`}>
        <div className={styles.messagesContainer}>
          {/* add message component here */}
          <p>Message component placeholder</p>
        </div>
        
        <div className={`${styles.composer} flex-row`}>
          {/* Add onSendMessage={handleSendMessage} */}
          <ChatInput disabled={!isMember}/>
        </div>
      </div>

      {/* MemberList */}
      {activePanel === "memberList" && (
        <MemberList chat={chat} onClose={() => setActivePanel(null)} refetchChat={refetchChat} />
      )}

      {/* EditGroup */}
      {activePanel === "editGroup" && (
        // maybe dont refetch chat manually, instead use sockets to update chat info
        <EditGroup chat={chat} onClose={() => setActivePanel(null)} refetchChat={refetchChat} />
      )}

      {activePanel === "addMember" && (
        // maybe dont refetch chat manually, instead use sockets to update chat info
        <AddMember chat={chat} onClose={() => setActivePanel(null)} refetchChat={refetchChat} />
      )}
    </div>
  );
};