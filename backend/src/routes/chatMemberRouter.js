import { Router } from "express";
import { isChatAdmin } from "../middleware/authMiddleware.js";
import { validateAddChatMember, validateRole, validateUuidParam } from "../middleware/validators.js";
import { handleValidation } from "../middleware/handleValidation.js";
import {
  addChatMember,
  leaveGroupChat,
  removeChatMember,
  updateChatMemberRole
} from "../controllers/chatMemberController.js";

// mergeParams: true allows access to req.params.chatId from parent router
const chatMemberRouter = Router({ mergeParams: true });

chatMemberRouter.use(validateUuidParam('chatId'));

chatMemberRouter.post('/',
  isChatAdmin,
  validateAddChatMember,
  handleValidation,
  addChatMember
);

chatMemberRouter.delete('/me',
  handleValidation,
  leaveGroupChat
);

chatMemberRouter.delete('/:memberId',
  isChatAdmin,
  validateUuidParam('memberId'),
  handleValidation,
  removeChatMember
);

chatMemberRouter.patch('/:memberId/role',
  isChatAdmin,
  validateUuidParam('memberId'),
  validateRole,
  handleValidation,
  updateChatMemberRole
);

export default chatMemberRouter;