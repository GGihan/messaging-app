import { matchedData } from "express-validator";
import { chatService } from "../services/chatService.js";

export const addChatMember = async (req, res) => {
  const { chatId, userIds } = matchedData(req);

  const newMembers = await chatService.addChatMember(chatId, userIds);

  return res.status(201).json({
    success: true,
    message: 'Members successfully added',
    data: {
      addedMembers: newMembers,
    },
  });
};

export const leaveGroupChat = async (req, res) => {
  const currentUserId = req.user?.id;
  const { chatId } = matchedData(req);

  const member = await chatService.leaveGroupChat(chatId, currentUserId);

  return res.json({
    success: true,
    message: 'Member successfully left',
    data: {
      member,
    },
  });
};

export const removeChatMember = async (req, res) => {
  const currentUserId = req.user?.id;
  const { chatId, memberId } = matchedData(req);

  const member = await chatService.removeChatMember(chatId, memberId, currentUserId);

  return res.json({
    success: true,
    message: 'Member successfully removed',
    data: {
      member,
    },
  });
};