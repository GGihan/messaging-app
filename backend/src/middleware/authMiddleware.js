import { prisma } from "../../lib/prisma.js";
import { ForbiddenError, NotFoundError, UnauthenticatedError } from "../errors/AppError.js";

export const requireAuth = (req, res, next) => {
  if (!req.isAuthenticated() || !req.user) {
    throw new UnauthenticatedError('Authentication required to perform this action');
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

  req.chatMember = membership;

  next();
};

export const isChatMember = async (req, res, next) => {
  const membership = await prisma.chatMember.findUnique({
    where: { 
      userId_chatId: {
        chatId: req.params.chatId, userId: req.user.id
      },
    },
  });

  if (!membership || membership.leftAt !== null) {
    throw new ForbiddenError('You must be an active member of this chat to perform this action');
  }

  req.chatMember = membership;

  next();
};

export const requireChatMembership = async (req, res, next) => {
  const membership = await prisma.chatMember.findUnique({
    where: { 
      userId_chatId: {
        chatId: req.params.chatId, userId: req.user.id
      },
    },
  });

  if (!membership) {
    throw new NotFoundError('Member not found');
  }

  req.chatMember = membership;

  next();
};