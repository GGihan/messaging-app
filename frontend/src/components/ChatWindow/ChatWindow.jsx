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
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import MemberList from "../Member/MemberList/MemberList";
import EditGroup from "../EditGroup/EditGroup";
import AddMember from "../AddMember/AddMember";
import { mutate } from "swr";
import toast from "react-hot-toast";
import { ChatInput } from "../ui/ChatInput/ChatInput";
import MessageCard from "../MessageCard/MessageCard";
import { useChatMessages } from "@/hooks/useChatMessages";
import { socket } from "@/config/socket";
import { useSocketEvent } from "@/hooks/useSocketEvent";

const chatFetcher = (url) => apiClient(url).then(res => res.data.chat);

export default function ChatWindow() {
  const { user } = useAuth();
  const activeChatId = useChatStore((state) => state.activeChatId);
  const closeChat = useChatStore((state) => state.closeChat);
  const [activePanel, setActivePanel] = useState(null);
  
  const containerRef = useRef(null);
  const bottomAnchorRef = useRef(null);
  const prevScrollHeightRef = useRef(0);
  const isInitialLoadRef = useRef(true);

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

  const {
    messages,
    refetchMessages,
    isLoadingMore,
    hasMore,
    loadMore,
  } = useChatMessages(activeChatId);

  useEffect(() => {
    isInitialLoadRef.current = true;
    prevScrollHeightRef.current = 0;
    refetchMessages();
  }, [activeChatId, refetchMessages]);

  // Single layout effect handling all scroll adjustments
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || messages.length === 0) return;

    // Initial Load: scroll immediately to bottom anchor
    if (isInitialLoadRef.current) {
      if (bottomAnchorRef.current) {
        bottomAnchorRef.current.scrollIntoView({ behavior: "instant", block: "end" });
      } else {
        container.scrollTop = container.scrollHeight;
      }
      isInitialLoadRef.current = false;
      return;
    }

    // Prepend pagination: maintain viewport offset
    if (prevScrollHeightRef.current > 0) {
      const heightDifference = container.scrollHeight - prevScrollHeightRef.current;
      container.scrollTop += heightDifference;
      prevScrollHeightRef.current = 0;
    }
  }, [messages, activeChatId]);

  // Handle upward infinite scrolling
  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) return;

    // Trigger loadMore within 80px from top
    if (container.scrollTop <= 80 && hasMore && !isLoadingMore) {
      prevScrollHeightRef.current = container.scrollHeight;
      loadMore();
    }
  };

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

      mutate(['/friendships', { status: 'ACCEPTED' }]);
    } catch (error) {
      toast.error(error.message || 'Could not block user');
    }
  };

  const handleDeleteGroup = async () => {
    const targetId = chat?.id;

    closeChat();

    try {
      mutate(
        '/chats',
        () =>
          apiClient(`/chats/${targetId}`, {
            method: 'DELETE',
          }),
        {
          optimisticData: (chats = []) =>
            chats.filter((chat) => chat.id !== targetId),
          populateCache: false,
          rollbackOnError: true,
          revalidate: true,
        }
      );
      
    } catch (error) {
      mutate('/chats');
      toast.error(error.message || 'Could not delete group');
    }
  };

  const handleLeaveGroup = async () => {
    const targetId = chat?.id;

    try {
      await refetchChat(
        () =>
          apiClient(`/chats/${targetId}/members/me`, {
            method: 'DELETE',
          }),
        {
          optimisticData: (current = {}) => {
            return {
              ...current,
              members: (current.members).filter(
                (member) => member.userId !== user.id
              ),
            };
          },
          populateCache: false,
          rollbackOnError: true,
          revalidate: true,
        }
      );
    } catch (error) {
      toast.error(error.message || 'Could not leave group');
    }
  };

  const handleRemoveChat = async () => {
    const targetId = chat?.id;

    closeChat();

    try {
      await mutate(
        '/chats',
        () => 
          apiClient(`/chats/${targetId}/history`, {
            method: 'DELETE',
          }),
        {
          optimisticData: (chats = []) =>
            chats.filter((chat) => chat.id !== targetId),
          populateCache: false,
          rollbackOnError: true,
          revalidate: true,
        }
      );

      await refetchMessages();
    } catch (error) {
      toast.error(error.message || 'Could not remove chat history');
    }
  };

  const handleSendMessage = async (data) => {
    const targetId = chat?.id;
    const text = data?.text;
    // adjust for multiple images later
    const file = data?.attachments[0];

    const formData = new FormData();
    if (text) formData.append('text', text);

    // adjust for multiple images later
    if (file) formData.append('image', file);

    try {
      await apiClient(`/chats/${targetId}/messages`, {
        method: 'POST',
        body: formData,
      });

      // change later for socket update
      mutate('/chats');
      await refetchMessages();

      // Scroll to bottom after sending
      requestAnimationFrame(() => {
        bottomAnchorRef.current?.scrollIntoView({ behavior: "smooth" });
      });
    } catch (error) {
      toast.error(error.message || 'Could not send message');
    }
  };

  useSocketEvent(socket, 'chat_message', (incomingMessage) => {
    if (incomingMessage.chatId !== activeChatId) return;

    refetchMessages(
      (pages = []) => {
        if (!pages.length) return pages;

        const [firstPage, ...restPages] = pages;

        return [
          {
            ...firstPage,
            messages: [...firstPage.messages, incomingMessage],
          },
          ...restPages,
        ];
      },
      { revalidate: false }
    );
  });

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
        <div
          className={`${styles.messagesContainer} flex-column`}
          ref={containerRef}
          onScroll={handleScroll}
        >
          {messages.map((message) => (
            <MessageCard key={message.id} message={message} isGroup={isGroup} />
          ))}

          {/* Anchor for scroll tracking */}
          <div ref={bottomAnchorRef} className={styles.bottomAnchor} aria-hidden="true" />
        </div>
        
        <div className={`${styles.composer} flex-row`}>
          <ChatInput disabled={!isMember} onSendMessage={handleSendMessage}/>
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