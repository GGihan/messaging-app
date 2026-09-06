export const isMessageReadByUser = (message, member) => {
  if (!message || !member) return false;
  if (message.senderId === member.userId) return true;
  if (!member.lastReadAt) return false;

  return new Date(member.lastReadAt) >= new Date(message.createdAt);
};

export const isMessageReadByAll = (message, allMembers) => {
  if (!message || !allMembers?.length) return false;

  const otherMembers = allMembers.filter((m) => m.userId !== message.senderId);
  if (otherMembers.length === 0) return true;

  const messageTime = new Date(message.createdAt);

  return otherMembers.every((member) => {
    return member.lastReadAt && new Date(member.lastReadAt) >= messageTime;
  });
};

export const formatMessageStatus = (message, currentUserId, allMembers) => {
  const currentMember = allMembers.find((m) => m.userId === currentUserId);
  const isSender = message.senderId === currentUserId;

  return {
    ...message,
    isReadByMe: isMessageReadByUser(message, currentMember),
    isReadByAll: isSender ? isMessageReadByAll(message, allMembers) : null,
  };
};

export const formatChatSummary = (chat, currentUserId) => {
  const lastMessage = chat.messages?.[0] || null;
  const currentMember = chat.members?.find((m) => m.userId === currentUserId);

  let isUnread = false;
  let isLastMessageReadByAll = false;

  if (lastMessage) {
    const isSender = lastMessage.senderId === currentUserId;

    if (!isSender && currentMember) {
      isUnread = !isMessageReadByUser(lastMessage, currentMember);
    }

    if (isSender) {
      isLastMessageReadByAll = isMessageReadByAll(lastMessage, chat.members);
    }
  }

  return {
    ...chat,
    isUnread,
    isLastMessageReadByAll,
    totalMessages: chat._count?.messages ?? 0,
  };
};