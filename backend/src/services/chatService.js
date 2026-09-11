import { cloudinaryService } from "../../lib/cloudinary.js";
import { logger } from "../../lib/logger.js";
import { prisma } from "../../lib/prisma.js";
import { formatChatSummary, formatMessageStatus } from "../helpers/chatStatusHelper.js";

const buildChatSearchFilter = (userId, search) => {
  if (!search) return {};

  return {
    OR: [
      {
        isGroup: true,
        name: { contains: search, mode: 'insensitive' },
      },
      {
        isGroup: false,
        members: {
          some: {
            userId: { not: userId },
            user: {
              profile: { displayName: { contains: search, mode: 'insensitive' } } ,
            },
          },
        },
      },
    ],
  };
};

export const chatService = {
  async getDirectChat(userIdA, userIdB) {
    const chat = await prisma.chat.findFirst({
      where: {
        AND: [
          { members: { some: { userId: userIdA } } },
          { members: { some: { userId: userIdB } } },
          { isGroup: false },
        ],
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                lastActiveAt: true,
                profile: true,
              },
            },
          },
        },
        messages: {
          take: 30,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!chat) return null;

    // Reverse message order
    const chronologicalMessages = [...chat.messages].reverse();

    const enrichedMessages = chronologicalMessages.map((msg) =>
      formatMessageStatus(msg, userIdA, chat.members)
    );

    return {
      ...chat,
      messages: enrichedMessages,
    };
  },

  async createDirectChat(userIdA, userIdB) {
    const newChat = await prisma.chat.create({
      data: {
        isGroup: false,
        members: {
          create: [
            { userId: userIdA },
            { userId: userIdB },
          ],
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                lastActiveAt: true,
                profile: true,
              },
            },
          },
        },
      },
    });

    return { ...newChat, messages: [] };
  },

  async getAllChats(userId, search) {
    const chats = await prisma.chat.findMany({
      where: {
        members: {
          some: {
            userId,
            deletedAt: null,
          },
        },
        ...buildChatSearchFilter(userId, search),
      },
      include: {
        members: {
          where: {
            leftAt: null,
          },
          include: {
            user: {
              select: {
                id: true,
                lastActiveAt: true,
                profile: true,
              },
            },
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            sender: {
              select: {
                id: true,
                profile: {
                  select: {
                    displayName: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: { lastMessageAt: 'desc' }
    });

    return chats.map((chat) => formatChatSummary(chat, userId));
  },

  async createGroupChat(currentUserId, { id, name, avatarUrl = null, memberIds = [] }) {
    const distinctMemberIds = [
      ...new Set(memberIds.filter((id) => id !== currentUserId)),
    ];

    const memberData = [
      { userId: currentUserId, role: 'ADMIN' },
      ...distinctMemberIds.map((userId) => ({
        userId,
        role: 'MEMBER',
      })),
    ];

    return await prisma.chat.create({
      data: {
        ...(id && { id }),
        isGroup: true,
        name,
        avatarUrl,
        members: {
          create: memberData,
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                lastActiveAt: true,
                profile: true,
              },
            },
          },
        },
      },
    });
  },

  async updateGroupChat({ id, name, avatarUrl }) {
    return prisma.chat.update({
      where: { id },
      data: {
        name,
        avatarUrl,
      },
    });
  },

  async deleteGroupChat(chatId, currentUserId) {
    const deletedChat = await prisma.chat.delete({
      where: { id: chatId },
    });

    if (deletedChat.avatarUrl) {
      const publicId = cloudinaryService.getPublicIdFromUrl(deletedChat.avatarUrl);

      if (publicId) {
        try {
          await cloudinaryService.deleteFromCloud(publicId);
        } catch (cloudErr) {
          logger.error(
            { err: cloudErr, userId: currentUserId, publicId },
            'Failed to delete asset from Cloudinary'
          );
        }
      }
    }

    return deletedChat;
  },

  async getChatById(chatId, currentUserId) {
    const currentMember = await prisma.chatMember.findUnique({
      where: {
        userId_chatId: {
          userId: currentUserId,
          chatId,
        },
      },
    });

    if (!currentMember || currentMember.leftAt !== null) {
      return null;
    }

    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        members: {
          some: { userId: currentUserId },
        },
      },
      include: {
        members: {
          where: {
            leftAt: null,
          },
          include: {
            user: {
              select: {
                id: true,
                lastActiveAt: true,
                profile: true,
              },
            },
          },
        },
        messages: {
          where: {
            ...(currentMember.deletedAt && { createdAt: { gt: currentMember.deletedAt } }),
          },
          take: 30,
          orderBy: { createdAt: 'desc' },
          include: {
            sender: {
              select: {
                id: true,
                profile: {
                  select: {
                    displayName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!chat) return null;

    // Reverse message order
    const chronologicalMessages = [...chat.messages].reverse();

    const enrichedMessages = chronologicalMessages.map((msg) =>
      formatMessageStatus(msg, currentUserId, chat.members)
    );

    return {
      ...chat,
      messages: enrichedMessages,
    };
  },

  async deleteChatHistory(chatId, currentUserId) {
    return prisma.chatMember.update({
      where: {
        userId_chatId: {
          userId: currentUserId,
          chatId,
        },
      },
      data: {
        deletedAt: new Date(Date.now()),
      },
    });
  },

  async addChatMember(chatId, userIds) {
    const now = new Date();

    return prisma.$transaction(async (tx) => {
      const existingActiveMembers = await tx.chatMember.findMany({
        where: {
          chatId,
          userId: { in: userIds },
          leftAt: null,
        },
        select: { userId: true },
      });

      const existingActiveUserIds = new Set(
        existingActiveMembers.map((m) => m.userId)
      );

      // Determine who needs to be added or re-activated
      const targetUserIds = userIds.filter((id) => !existingActiveUserIds.has(id));

      if (targetUserIds.length === 0) {
        return [];
      }

      // Reset membership for users who had previously left
      await tx.chatMember.updateMany({
        where: {
          chatId,
          userId: { in: targetUserIds },
          leftAt: { not: null },
        },
        data: {
          leftAt: null,
          joinedAt: now,
          role: 'MEMBER',
        },
      });

      // Insert any completely new members 
      const memberData = userIds.map((userId) => ({
        chatId,
        userId,
        role: 'MEMBER',
      }));

      await tx.chatMember.createMany({
        data: memberData,
        skipDuplicates: true,
      });

      await tx.chat.update({
        where: { id: chatId },
        data: { updatedAt: now },
      });

      // Return new members
      return tx.chatMember.findMany({
        where: {
          chatId,
          userId: { in: targetUserIds },
          leftAt: null,
        },
        include: {
          user: {
            select: {
              id: true,
              lastActiveAt: true,
              profile: true,
            },
          },
        },
      });
    });
  },
};