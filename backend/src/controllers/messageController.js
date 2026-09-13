import { matchedData } from "express-validator";
import { messageService } from "../services/messageService.js";

export const createMessage = async (req, res) => {
  const currentUserId = req.user?.id;
  const fileBuffer = req.file?.buffer;
  const { chatId, text } = matchedData(req);

  const message = await messageService.createMessage({
    senderId: currentUserId,
    chatId,
    text,
    fileBuffer
  });

  return res.status(201).json({
    success: true,
    message: 'Message successfully created.',
    data: {
      message,
    },
  });
};