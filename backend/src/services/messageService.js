import { prisma } from "../../lib/prisma.js";
import { buildMessageVisibilityFilter, formatMessageStatus } from "../helpers/chatStatusHelper.js";
import { cloudinaryService } from "./cloudinaryService.js";


export const messageService = {
  async createMessage({ senderId, chatId, text, fileBuffer }) {
    let imageUrl = null;

    if (fileBuffer) {
      const uploadResult = await cloudinaryService.uploadMessageAttachment(fileBuffer, chatId);
      imageUrl = uploadResult.secure_url;
    }

    const message = await prisma.$transaction(async (tx) => {
      const createdMessage = await tx.message.create({
        data: {
          senderId,
          chatId,
          text: text?.trim() || null,
          imageUrl,
        },
        include: {
          sender: {
            select: {
              id: true,
              profile: {
                select: {
                  displayName: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      });

      await tx.chat.update({
        where: { id: chatId },
        data: {
          lastMessageAt: createdMessage.createdAt,
          updatedAt: createdMessage.createdAt,
        },
      });

      await tx.chatMember.updateMany({
        where: {
          chatId,
          userId: senderId,
        },
        data: {
          lastReadAt: createdMessage.createdAt,
        },
      });

      return createdMessage;
    });

    return message;
  },

  async getChatMessages({ chatId, currentUserId, currentMember, cursor }) {
    const take = 30;

    const visibilityWhere = buildMessageVisibilityFilter(currentMember);

    const messages = await prisma.message.findMany({
      where: {
        chatId,
        ...visibilityWhere,
      },
      take: take + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
      orderBy: [
        { createdAt: 'desc' },
        { id: 'desc' },
      ],
      include: {
        sender: {
          select: {
            id: true,
            profile: {
              select: {
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    const hasMore = messages.length > take;
    const pagedMessages = hasMore ? messages.slice(0, take) : messages;

    const oldestMessage = pagedMessages[pagedMessages.length - 1];
    const nextCursor = hasMore && oldestMessage ? oldestMessage.id : null;

    const chronological = [...pagedMessages].reverse();

    const members = await prisma.chatMember.findMany({
      where: { chatId, leftAt: null },
    });

    return {
      messages: chronological.map((msg) =>
        formatMessageStatus(msg, currentUserId, members)
      ),
      pagination: {
        nextCursor,
        hasMore,
      },
    };
  },
};