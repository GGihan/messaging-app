import { prisma } from "../../lib/prisma.js";
import { formatChatSummary, formatMessageStatus } from "../helpers/chatStatusHelper.js";

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

  async getAllChats(userId) {
    const chats = await prisma.chat.findMany({
      where: {
        members: { some: { userId } }
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
};