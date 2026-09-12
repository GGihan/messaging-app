export const isMessageReadByUser = (message, member) => {
  if (!message || !member) return false;
  if (message.senderId === member.userId) return true;

  const messageTime = new Date(message.createdAt);

  if (member.joinedAt && new Date(member.joinedAt) > messageTime) {
    return false;
  }

  if (!member.lastReadAt) return false;

  return new Date(member.lastReadAt) >= messageTime;
};

export const isMessageReadByAll = (message, allMembers) => {
  if (!message || !allMembers?.length) return false;

  const messageTime = new Date(message.createdAt);

  const targetMembers = allMembers.filter((m) => {
    const isSender = m.userId === message.senderId;
    const isActive = m.leftAt === null;
    const joinedBeforeMessage = m.joinedAt && new Date(m.joinedAt) <= messageTime;

    return !isSender && isActive && joinedBeforeMessage;
  });

  if (targetMembers.length === 0) return true;

  return targetMembers.every((member) => {
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

  if (lastMessage && currentMember && currentMember.leftAt === null) {
    const isSender = lastMessage.senderId === currentUserId;
    const messageTime = new Date(lastMessage.createdAt);
    const joinedBeforeMessage = !currentMember.joinedAt || new Date(currentMember.joinedAt) <= messageTime;

    if (!isSender && joinedBeforeMessage) {
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