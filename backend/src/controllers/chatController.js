import { matchedData } from "express-validator";
import { chatService } from "../services/chatService.js";
import { cloudinaryService } from "../../lib/cloudinary.js";
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

  const chats = await chatService.getAllChats(currentUserId);

  return res.json({
    success: true,
    data: {
      chats,
    },
  });
};

export const createGroupChat = async (req, res) => {
  const currentUserId = req.user?.id;
  const { name, memberIds } = matchedData(req);

  let currentAvatarUrl = null;
  const chatId = crypto.randomUUID();

  if (req.file) {
    let uploadResult;
    try {
      uploadResult = await cloudinaryService.uploadChatAvatar(req.file.buffer, chatId);
      currentAvatarUrl = uploadResult.secure_url;
    } catch (uploadError) {
      logger.error({
        err: uploadError,
        currentUserId,
        context: 'chat_avatar_upload',
      }, 'Failed to upload avatar to Cloudinary');
      return res.status(502).json({
        success: false,
        message: 'Image upload failed. Please try again later.',
      });
    }
  }

  const groupChat = await chatService.createGroupChat(
    currentUserId, { id: chatId, name, avatarUrl: currentAvatarUrl, memberIds }
  );

  return res.status(201).json({
    success: true,
    message: 'Group chat created.',
    data: {
      groupChat,
    },
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