import { prisma } from "../../lib/prisma.js";
import { presenceService } from "./presenceService.js";

export const findExistingRelationship = async (userAId, userBId) => {
  return prisma.friendship.findFirst({
    where: {
      OR: [
        { senderId: userAId, receiverId: userBId },
        { senderId: userBId, receiverId: userAId },
      ],
    },
  });
};

export const findAllRelationships = async (userId, status, type) => {
  const where = {};

  if (type === 'outgoing') {
    where.senderId = userId;
  } else if (type === 'incoming') {
    where.receiverId = userId;
  } else {
    where.OR = [
      { senderId: userId },
      { receiverId: userId },
    ];
  }

  if (status) {
    where.status = status;
  }

  // Shared user selection structure
  const userSelect = {
    id: true,
    username: true,
    lastActiveAt: true,
    profile: true,
  };

  const friendships = await prisma.friendship.findMany({
    where,
    select: {
      id: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      senderId: true,
      receiverId: true,
      sender: {
        select: userSelect,
      },
      receiver: {
        select: userSelect,
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });

  return friendships.map((friendship) => {
    const isSender = friendship.senderId === userId;
    const friend = isSender ? friendship.receiver : friendship.sender;
    const isAccepted = friendship.status === 'ACCEPTED';
    const isBlocked = friendship.status === 'BLOCKED';

    const isOnline = isAccepted ? presenceService.isUserOnline(friend.id) : false;
    const lastActiveAt = !isBlocked ? friend.lastActiveAt : null;

    return {
      ...friendship,
      friend: {
        ...friend,
        isOnline,
        lastActiveAt,
      },
    };
  });
};

export const findAllAcceptedFriendIds =  async (userId) => {
  const friendships = await prisma.friendship.findMany({
    where: {
      status: 'ACCEPTED',
      OR: [{ senderId: userId }, { receiverId: userId }],
    },
    select: { senderId: true, receiverId: true },
  });
  
  const friendIds = friendships.map((f) =>
    f.senderId === userId ? f.receiverId : f.senderId
  );

  return friendIds;
};
      