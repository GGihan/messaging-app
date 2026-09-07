import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { validateCreateGroupChat, validateReceiverBody, validateUuidBody, validateUuidParam } from "../middleware/validators.js";
import { createGroupChat, createOrGetDirectChat, getAllChats, getChatById } from "../controllers/chatController.js";
import { handleValidation } from "../middleware/handleValidation.js";
import { uploadImage } from "../middleware/multerUpload.js";

const chatRouter = Router();

chatRouter.use(requireAuth);

chatRouter.post('/',
  validateUuidBody('receiverId'),
  validateReceiverBody,
  handleValidation,
  createOrGetDirectChat
);

chatRouter.get('/',
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

export default chatRouter;