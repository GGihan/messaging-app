import { cloudinaryService } from "./cloudinaryService.js";
import { prisma } from "../../lib/prisma.js";
import { BadRequestError, NotFoundError } from "../errors/AppError.js";
import {
  formatChatSummary,
  isChatVisibleToUser
} from "../helpers/chatStatusHelper.js";
import { messageService } from "./messageService.js";

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

async function handleAdminSuccession(tx, chatId, leavingUserId) {
  const remainingAdminsCount = await tx.chatMember.count({
    where: {
      chatId,
      role: 'ADMIN',
      leftAt: null,
      userId: { not: leavingUserId },
    },
  });

  if (remainingAdminsCount > 0) return;

  const oldestMember = await tx.chatMember.findFirst({
    where: {
      chatId,
      leftAt: null,
      userId: { not: leavingUserId },
    },
    orderBy: { joinedAt: 'asc' },
  });

  if (!oldestMember) return;

  await tx.chatMember.update({
    where: {
      userId_chatId: {
        userId: oldestMember.userId,
        chatId,
      },
    },
    data: { role: 'ADMIN' },
  });
};

export const chatService = {
  async findDirectChat(userIdA, userIdB) {
    return prisma.chat.findFirst({
      where: {
        isGroup: false,
        AND: [
          { members: { some: { userId: userIdA } } },
          { members: { some: { userId: userIdB } } },
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
      },
    });
  },

  async getOrCreateDirectChat(userIdA, userIdB) {
    let chat = await this.findDirectChat(userIdA, userIdB);
    let created = false;

    if (!chat) {
      chat = await prisma.chat.create({
        data: {
          isGroup: false,
          members: {
            create: [
              { userId: userIdA, role: 'MEMBER' },
              { userId: userIdB, role: 'MEMBER' },
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
      created = true;
    }

    const currentMember = chat.members.find((m) => m.userId === userIdA);

    const fullChat = await this.getChatById(chat.id, userIdA, currentMember);

    return {
      chat: fullChat,
      created,
    };
  },

  async getAllChats(userId, search) {
    const chats = await prisma.chat.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
        ...buildChatSearchFilter(userId, search),
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
          take: 5,
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
      orderBy: { lastMessageAt: 'desc' }
    });

    return chats
      .filter((chat) => {
        const currentMember = chat.members.find(m => m.userId === userId);
        return isChatVisibleToUser(chat, currentMember);
      })
      .map((chat) => {
        const currentMember = chat.members.find(m => m.userId === userId)
        
        const visibleMessages = chat.messages.filter((msg) => {
          const afterDeleted = !currentMember.deletedAt || msg.createdAt > currentMember.deletedAt;
          const beforeLeft = !currentMember.leftAt || msg.createdAt <= currentMember.leftAt;
          return afterDeleted && beforeLeft;
        });

        const activeMembers = chat.members.filter((m) => m.leftAt === null);

        return formatChatSummary({
          ...chat,
          members: activeMembers,
          messages: visibleMessages.slice(0, 1),
        }, userId);
      });
  },

  async createGroupChat(currentUserId, { name, fileBuffer, memberIds = [] }) {
    const chatId = crypto.randomUUID();
    let avatarUrl = null;

    if (fileBuffer) {
      const uploadResult = await cloudinaryService.uploadChatAvatar(fileBuffer, chatId);
      avatarUrl = uploadResult.secure_url;
    }

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
        id: chatId,
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

  async updateGroupChat({ chatId, name, fileBuffer }) {
    const updateData = {};

    if (name !== undefined) {
      updateData.name = name;
    }

    if (fileBuffer) {
      const uploadResult = await cloudinaryService.uploadChatAvatar(fileBuffer, chatId);
      updateData.avatarUrl = uploadResult.secure_url;
    }

    return prisma.chat.update({
      where: { id: chatId },
      data: updateData,
    });
  },

  async deleteGroupChat(chatId) {
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      select: {
        id: true,
        isGroup: true,
        avatarUrl: true,
      },
    });

    if (!chat) {
      throw new NotFoundError('Chat not found');
    }

    if (!chat.isGroup) {
      throw new BadRequestError('Cannot delete a direct chat');
    }

    const deletedChat = await prisma.chat.delete({
      where: { id: chatId },
    });

    if (chat.avatarUrl) {
      const publicId = cloudinaryService.getPublicIdFromUrl(chat.avatarUrl);

      if (publicId) {
        await cloudinaryService.deleteFromCloud(publicId).catch(() => null);
      }
    }

    return deletedChat;
  },

  async getChatById(chatId, currentUserId, currentMember) {
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
          orderBy: [
            { joinedAt: 'asc' },
            { id: 'asc' },
          ],
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

    if (!chat) {
      throw new NotFoundError('Chat not found');
    }

    const { messages, pagination } = await messageService.getChatMessages({
      chatId,
      currentUserId,
      currentMember,
    });

    return {
      ...chat,
      messages,
      pagination,
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
        deletedAt: new Date(),
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
      const memberData = targetUserIds.map((userId) => ({
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

  async leaveGroupChat(chatId, currentUserId) {
    const now = new Date();

    return prisma.$transaction(async (tx) => {
      const member = await tx.chatMember.findUnique({
        where: {
          userId_chatId: {
            userId: currentUserId,
            chatId,
          },
        },
        include: {
          chat: {
            select: {
              isGroup: true,
            },
          },
        },
      });

      if (!member) {
        throw new NotFoundError('You are not a member of this chat');
      }

      if (!member.chat.isGroup) {
        throw new BadRequestError('Cannot leave a direct chat');
      }

      if (member.leftAt !== null) {
        throw new BadRequestError('You have already left this chat');
      }

      if (member.role === 'ADMIN') {
        await handleAdminSuccession(tx, chatId, currentUserId);
      }

      // Mark the user as left and touch parent chat updatedAt
      const updatedMember = await tx.chatMember.update({
        where: {
          userId_chatId: {
            userId: currentUserId,
            chatId,
          },
        },
        data: {
          leftAt: now,
        },
      });

      await tx.chat.update({
        where: { id: chatId },
        data: { updatedAt: now },
      });

      return updatedMember;
    });
  },

  async removeChatMember(chatId, memberId, currentUserId) {
    const now = new Date();

    return prisma.$transaction(async (tx) => {
      const targetMember = await tx.chatMember.findUnique({
        where: {
          id: memberId
        },
        include: {
          chat: {
            select: {
              isGroup: true
            },
          },
        },
      });

      if (!targetMember || targetMember.chatId !== chatId) {
        throw new NotFoundError('Member not found')
      }

      if (!targetMember.chat.isGroup) {
        throw new BadRequestError('Cannot remove members from a direct chat');
      }

      if (targetMember.userId === currentUserId) {
        throw new BadRequestError('You cannot remove yourself from this chat');
      }

      if (targetMember.leftAt !== null) {
        throw new BadRequestError('Member has already left this chat');
      }

      const updatedMember = await tx.chatMember.update({
        where: {
          id: memberId,
        },
        data: {
          leftAt: now,
        },
      });

      await tx.chat.update({
        where: { id: chatId },
        data: { updatedAt: now },
      });

      return updatedMember;
    });
  },

  async updateChatMemberRole(chatId, memberId, role, currentUserId) {
    const now = new Date();

    return prisma.$transaction(async (tx) => {
      const targetMember = await tx.chatMember.findUnique({
        where: {
          id: memberId,
        },
        include: {
          chat: {
            select: {
              isGroup: true
            },
          },
        },
      });

      if (!targetMember || targetMember.chatId !== chatId) {
        throw new NotFoundError('Member not found')
      }

      if (!targetMember.chat.isGroup) {
        throw new BadRequestError('Cannot update member roles in a direct chat');
      }

      if (targetMember.userId === currentUserId) {
        throw new BadRequestError('You cannot update your own role');
      }

      if (targetMember.leftAt !== null) {
        throw new BadRequestError('Member has left this chat');
      }

      if (targetMember.role === role) {
        throw new BadRequestError('Member already has this role');
      }

      const updatedMember = await tx.chatMember.update({
        where: {
          id: memberId,
        },
        data: {
          role,
        },
      });

      await tx.chat.update({
        where: { id: chatId },
        data: { updatedAt: now },
      });

      return updatedMember;
    });
  },

  async getMembership(chatId, userId, filters = {}) {
    if (!chatId || !userId) return null;

    return prisma.chatMember.findFirst({
      where: {
        chatId,
        userId,
        ...filters,
      },
    });
  },

  async getActiveMembership(chatId, userId) {
    return this.getMembership(chatId, userId, { leftAt: null });
  },

  async getActiveAdminMembership(chatId, userId) {
    return this.getMembership(chatId, userId, { leftAt: null, role: 'ADMIN' });
  },

  async markChatAsRead (chatId, userId, timestamp = new Date()) {
    return prisma.chatMember.update({
      where: {
        userId_chatId: { userId, chatId },
      },
      data: {
        lastReadAt: timestamp,
      },
    });
  },

  async getReceiverMemberIds(chatId, senderId) {
    const members = await prisma.chatMember.findMany({
      where: {
        chatId,
        userId: { not: senderId },
        leftAt: null,
      },
      select: {
        userId: true,
      },
    });

    return members.map((m) => m.userId);
  },
};