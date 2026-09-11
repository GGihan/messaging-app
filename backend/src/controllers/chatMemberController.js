import { matchedData } from "express-validator";
import { chatService } from "../services/chatService.js";

export const addChatMember = async (req, res) => {
  const { chatId, userIds } = matchedData(req);

  const newMembers = await chatService.addChatMember(chatId, userIds);

  return res.status(201).json({
    success: true,
    data: {
      addedMembers: newMembers,
    },
  });
};