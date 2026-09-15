import { matchedData } from "express-validator";
import { messageService } from "../services/messageService.js";
import { messageEmitter } from "../sockets/emitters/messageEmitter.js";

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

  messageEmitter.newMessage(chatId, message);

  return res.status(201).json({
    success: true,
    message: 'Message successfully created.',
    data: {
      message,
    },
  });
};

export async function getChatMessages(req, res, next) {
  const currentUserId = req.user?.id;
  const currentMember = req.chatMember;
  const { chatId, cursor } = matchedData(req);

  const data = await messageService.getChatMessages({
    chatId,
    currentUserId,
    currentMember,
    cursor,
  });

  res.json({
    success: true,
    data,
  });
};