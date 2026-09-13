import { prisma } from "../../lib/prisma.js";
import { cloudinaryService } from "./cloudinaryService";

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
};