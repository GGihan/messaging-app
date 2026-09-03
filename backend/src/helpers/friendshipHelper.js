import { prisma } from "../../lib/prisma.js";

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

  return prisma.friendship.findMany({
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
};