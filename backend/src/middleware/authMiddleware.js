import { ForbiddenError, NotFoundError, UnauthenticatedError } from "../errors/AppError.js";
import { chatService } from "../services/chatService.js";

export const requireAuth = (req, res, next) => {
  if (!req.isAuthenticated() || !req.user) {
    throw new UnauthenticatedError('Authentication required to perform this action');
  }
  next();
};

export const isChatAdmin = async (req, res, next) => {
  const membership = await chatService.getActiveAdminMembership(
    req.params.chatId,
    req.user.id
  );

  if (!membership) {
    throw new ForbiddenError('You must be an active admin of this chat to perform this action');
  }

  req.chatMember = membership;

  next();
};

export const isChatMember = async (req, res, next) => {
  const membership = await chatService.getActiveMembership(
    req.params.chatId,
    req.user.id
  );

  if (!membership) {
    throw new ForbiddenError('You must be an active member of this chat to perform this action');
  }

  req.chatMember = membership;

  next();
};

export const requireChatMembership = async (req, res, next) => {
  const membership = await chatService.getMembership(
    req.params.chatId,
    req.user.id
  );

  if (!membership) {
    throw new NotFoundError('Member not found');
  }

  req.chatMember = membership;

  next();
};