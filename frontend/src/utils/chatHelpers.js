import groupAvatarFiller from "@/assets/icons/group.svg";
import profileAvatarFiller from "@/assets/icons/person.svg";
import { formatChatListDate, formatLastActive } from "./formatDate";

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
      subtitle: formatLastActive(otherUser?.lastActiveAt),
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
    };
  },
};