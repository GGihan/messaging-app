import { Router } from "express";
import { isChatAdmin, requireAuth } from "../middleware/authMiddleware.js";
import {
  validateChatSearchQuery,
  validateCreateGroupChat,
  validateReceiverBody,
  validateUpdateGroupChat,
  validateUuidBody,
  validateUuidParam 
} from "../middleware/validators.js";
import {
  createGroupChat,
  createOrGetDirectChat,
  deleteChatHistory,
  deleteGroupChat,
  getAllChats,
  getChatById,
  updateGroupChat
} from "../controllers/chatController.js";
import { handleValidation } from "../middleware/handleValidation.js";
import { uploadImage } from "../middleware/multerUpload.js";
import chatMemberRouter from "./chatMemberRouter.js";

const chatRouter = Router();

chatRouter.use(requireAuth);

chatRouter.post('/',
  validateUuidBody('receiverId'),
  validateReceiverBody,
  handleValidation,
  createOrGetDirectChat
);

chatRouter.get('/',
  validateChatSearchQuery,
  handleValidation,
  getAllChats
);

chatRouter.get('/:chatId',
  validateUuidParam('chatId'),
  handleValidation,
  getChatById
);

chatRouter.post('/groups',
  uploadImage.single('avatar'),
  validateCreateGroupChat,
  handleValidation,
  createGroupChat
);

chatRouter.patch('/:chatId',
  isChatAdmin,
  uploadImage.single('avatar'),
  validateUuidParam('chatId'),
  validateUpdateGroupChat,
  handleValidation,
  updateGroupChat
);

chatRouter.delete('/:chatId',
  isChatAdmin,
  validateUuidParam('chatId'),
  handleValidation,
  deleteGroupChat
);

chatRouter.delete('/:chatId/history',
  validateUuidParam('chatId'),
  handleValidation,
  deleteChatHistory
);

chatRouter.use('/:chatId/members',
  chatMemberRouter
);

export default chatRouter;