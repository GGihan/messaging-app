import { prisma } from "../../lib/prisma.js";

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

  if (!membership || membership.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: "Not an admin of this chat.",
    });
  }

  next();
};