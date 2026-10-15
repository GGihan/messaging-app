import groupAvatarFiller from "@/assets/icons/group.svg";
import profileAvatarFiller from "@/assets/icons/person.svg";
import { formatChatListDate, formatLastActive, formatMessageTime } from "./formatDate";

export const chatHelper = {
  getChatBarInfo(chat, currentUserId) {
    if (!chat) return null;

    if (chat.isGroup) {
      return {
        avatarUrl: chat?.avatarUrl || groupAvatarFiller,
        title: chat?.name || "Group",
        subtitle: null,
      };
    }

    // Direct chat
    const otherMember = chat.members.find((member) => member.user.id !== currentUserId);
    const otherUser = otherMember?.user;

    return {
      avatarUrl: otherUser?.profile?.avatarUrl || profileAvatarFiller,
      title: otherUser?.profile?.displayName,
      subtitle: otherMember.isOnline
        ? "Online"
        : formatLastActive(otherUser?.lastActiveAt),
    };
  },

  getChatPermissions(chat, currentUserId) {
    if (!chat || !currentUserId) {
      return {
        isGroup: false,
        isMember: false,
        isAdmin: false,
      };
    }

    const currentMember = chat.members?.find(
      (member) => (member.user?.id) === currentUserId
    );

    return {
      isGroup: Boolean(chat.isGroup),
      isMember: Boolean(currentMember && currentMember.leftAt === null),
      isAdmin: currentMember?.role === "ADMIN",
    };
  },

  getIsDirectChatBlocked(chat, currentUserId, blockedFriendships) {
    if (chat.isGroup) return false;
    if (blockedFriendships?.length === 0) return false;

    const otherMember = chat?.members?.find(
      (member) => (member.user?.id) !== currentUserId
    );
    
    const existingBlockedFriendship = blockedFriendships?.find(
      (friendship) => friendship.senderId === otherMember.userId
      || friendship.receiverId === otherMember.userId
    );

    if (!existingBlockedFriendship) return false;
    return true;
  },

  determineUserAvatarUrl(avatarUrl) {
    if (avatarUrl) {
      return avatarUrl
    } else {
      return profileAvatarFiller
    }
  },

  determineChatName(chat, currentUserId) {
    if (!chat) return null;

    if (chat.isGroup) {
      return {
        name: chat?.name || "Group",
      };
    }

    // Direct chat
    const otherMember = chat.members.find((member) => member.user.id !== currentUserId);
    const otherUser = otherMember?.user;

    return {
      name: otherUser?.profile?.displayName,
    };
  },

  // Add a check for isReadByAll and isUnread
  getChatCardInfo(chat, currentUserId) {
    if (!chat) return null;

    const isSenderMe = chat?.messages[0]?.sender?.id === currentUserId;

    if (chat.isGroup) {
      return {
        avatarUrl: chat?.avatarUrl || groupAvatarFiller,
        name: chat?.name || "Group",
        message: chat.messages[0] || "",
        sender: !isSenderMe ? chat.messages[0]?.sender?.profile?.displayName : "Me",
        date: formatChatListDate(chat.lastMessageAt || chat.createdAt),
        isRead: chat?.isLastMessageReadByAll || false,
        isSenderMe,
      };
    }

    // Direct chat
    const otherMember = chat.members.find((member) => member.user.id !== currentUserId);
    const otherUser = otherMember?.user;

    return {
      avatarUrl: otherUser?.profile?.avatarUrl || profileAvatarFiller,
      name: otherUser?.profile?.displayName,
      message: chat.messages[0] || "",
      date: formatChatListDate(chat.lastMessageAt || chat.createdAt),
      isRead: chat?.isLastMessageReadByAll || false,
      isSenderMe,
    };
  },

  getMessageInfo(message) {
    return {
      avatarUrl: message.sender?.profile?.avatarUrl || profileAvatarFiller,
      name: message.sender?.profile?.displayName,
      imageUrl: message?.imageUrl,
      text: message?.text,
      time: formatMessageTime(message.createdAt),
      isRead: message?.isReadByAll,
    };
  },
};