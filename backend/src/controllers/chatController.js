import { matchedData } from "express-validator";
import { chatService } from "../services/chatService.js";
import { cloudinaryService } from "../services/cloudinaryService.js";
import { logger } from "../../lib/logger.js";

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

export const getAllChats = async (req, res) => {
  const currentUserId = req.user?.id;
  const { search } = matchedData(req);

  const chats = await chatService.getAllChats(currentUserId, search);

  return res.json({
    success: true,
    data: {
      chats,
    },
  });
};

export const createGroupChat = async (req, res) => {
  const currentUserId = req.user?.id;
  const fileBuffer = req.file?.buffer;
  const { name, memberIds } = matchedData(req);

  const groupChat = await chatService.createGroupChat(
    currentUserId, { name, fileBuffer, memberIds }
  );

  return res.status(201).json({
    success: true,
    message: 'Group chat created.',
    data: {
      chat: groupChat,
    },
  });
};

export const updateGroupChat = async (req, res) => {
  const fileBuffer = req.file?.buffer;
  const { chatId, name } = matchedData(req);

  const updatedChat = await chatService.updateGroupChat({ chatId, name, fileBuffer});

  return res.json({
    success: true,
    message: 'Group chat updated.',
    data: {
      chat: updatedChat,
    },
  });
};

export const deleteGroupChat = async (req, res) => {
  const { chatId } = matchedData(req);

  await chatService.deleteGroupChat(chatId);
  
  return res.json({
    success: true,
    message: 'Chat has been deleted.',
  });
};

export const getChatById = async (req, res) => {
  const currentUserId = req.user?.id;
  const { chatId } = matchedData(req);

  const chat = await chatService.getChatById(chatId, currentUserId);

  if (!chat) {
    return res.status(404).json({
      success: false,
      message: 'Chat not found.',
    });
  }

  return res.json({
    success: true,
    data: {
      chat,
    },
  });
};

export const deleteChatHistory = async (req, res) => {
  const currentUserId = req.user?.id;
  const { chatId } = matchedData(req);

  const deletedChatHistory = await chatService.deleteChatHistory(chatId, currentUserId);

  return res.json({
    success: true,
    data: {
      chat: deletedChatHistory,
    },
  });
};