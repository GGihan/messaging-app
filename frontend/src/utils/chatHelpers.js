import groupAvatarFiller from "@/assets/icons/group.svg";
import profileAvatarFiller from "@/assets/icons/person.svg";
import { formatLastActive } from "./formatDate";

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

  getChatBarActions(chat, currentUserId) {
    // group and direct chat actions
  },
};