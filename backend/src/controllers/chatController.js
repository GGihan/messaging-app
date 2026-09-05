import { matchedData } from "express-validator";
import { chatService } from "../services/chatService.js";

export const createOrGetDirectChat = async (req, res) => {
  const currentUserId = req.user?.id;
  const { receiverId } = matchedData(req);

  let chat = await chatService.getDirectChat(currentUserId, receiverId);
  let statusCode = 200;
  let message = 'Direct chat found.'
  
  if (!chat) {
    chat = await chatService.createDirectChat(currentUserId, receiverId);
    statusCode = 201;
    message = 'Direct chat created.'
  }

  return res.status(statusCode).json({
    success: true,
    message,
    data: {
      chat,
    },
  });
};