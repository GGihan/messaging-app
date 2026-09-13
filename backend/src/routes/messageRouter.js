import { Router } from "express";
import { vailidateMessageCursorQuery, validateCreateMessage, validateUuidParam } from "../middleware/validators.js";
import { isChatMember, requireChatMembership } from "../middleware/authMiddleware.js";
import { handleValidation } from "../middleware/handleValidation.js";
import { uploadImage } from "../middleware/multerUpload.js";
import { createMessage, getChatMessages } from "../controllers/messageController.js";

// mergeParams: true allows access to req.params.chatId from parent router
const messageRouter = Router({ mergeParams: true });

messageRouter.use(
  validateUuidParam('chatId'),
);

messageRouter.post('/',
  isChatMember,
  uploadImage.single('image'),
  validateCreateMessage,
  handleValidation,
  createMessage
);

messageRouter.get('/',
  requireChatMembership,
  vailidateMessageCursorQuery,
  handleValidation,
  getChatMessages
);

export default messageRouter;