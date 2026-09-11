import { prisma } from "../../lib/prisma.js";
import { ForbiddenError } from "../errors/AppError.js";

export const requireAuth = (req, res, next) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required to perform this action.",
    });
  }
  next();
};

export const isChatAdmin = async (req, res, next) => {
  const membership = await prisma.chatMember.findUnique({
    where: { 
      userId_chatId: {
        chatId: req.params.chatId, userId: req.user.id
      },
    },
  });

  if (!membership || membership.leftAt !== null || membership.role !== 'ADMIN') {
    throw new ForbiddenError('You must be an active admin of this chat to perform this action');
  }

  next();
};