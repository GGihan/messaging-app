import { Router } from "express";
import { validateCreateMessage, validateUuidParam } from "../middleware/validators.js";
import { isChatMember } from "../middleware/authMiddleware.js";
import { handleValidation } from "../middleware/handleValidation.js";
import { uploadImage } from "../middleware/multerUpload.js";
import { createMessage } from "../controllers/messageController.js";

// mergeParams: true allows access to req.params.chatId from parent router
const messageRouter = Router({ mergeParams: true });

messageRouter.use(
  validateUuidParam('chatId'),
  isChatMember
);

messageRouter.post('/',
  uploadImage.single('image'),
  validateCreateMessage,
  handleValidation,
  createMessage
);

export default messageRouter;