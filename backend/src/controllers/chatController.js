import { matchedData } from "express-validator";
import { chatService } from "../services/chatService.js";

export const getOrCreateDirectChat = async (req, res) => {
  const currentUserId = req.user.id;
  const { receiverId } = matchedData(req);

  const { chat, created } = await chatService.getOrCreateDirectChat(currentUserId, receiverId);

  return res.status(created ? 201 : 200).json({
    success: true,
    message: created ? 'Direct chat created.' : 'Direct chat found.',
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
  const currentMember = req.chatMember;
  const { chatId } = matchedData(req);

  const chat = await chatService.getChatById(chatId, currentUserId, currentMember);

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
    message: 'Chat history has been deleted.',
    data: {
      chat: deletedChatHistory,
    },
  });
};