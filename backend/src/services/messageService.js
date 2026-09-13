import { prisma } from "../../lib/prisma.js";
import { cloudinaryService } from "./cloudinaryService";

export const messageService = {
  async createMessage({ senderId, chatId, text, fileBuffer }) {
    let imageUrl = null;

    if (fileBuffer) {
      const uploadResult = await cloudinaryService.uploadMessageAttachment(fileBuffer, chatId);
      imageUrl = uploadResult.secure_url;
    }

    const message = await prisma.message.create({
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

    return message;
  },
};