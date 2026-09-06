import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { validateReceiverBody, validateUuidBody } from "../middleware/validators.js";
import { createOrGetDirectChat, getAllChats } from "../controllers/chatController.js";
import { handleValidation } from "../middleware/handleValidation.js";

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

export default chatRouter;