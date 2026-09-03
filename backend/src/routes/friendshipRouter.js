import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { blockUser, sendFriendRequest, unblockUser } from "../controllers/friendshipController.js";
import { validateReceiverBody, validateReceiverParam, validateUuidBody, validateUuidParam } from "../middleware/validators.js";
import { handleValidation } from "../middleware/handleValidation.js";

const friendshipRouter = Router();

friendshipRouter.use(requireAuth)

friendshipRouter.post('/requests',
  validateUuidBody('receiverId'),
  validateReceiverBody,
  handleValidation,
  sendFriendRequest
);

friendshipRouter.post('/block',
  validateUuidBody('receiverId'),
  validateReceiverBody,
  handleValidation,
  blockUser
);

friendshipRouter.delete('/block/:receiverId',
  validateUuidParam('receiverId'),
  validateReceiverParam,
  handleValidation,
  unblockUser
);

export default friendshipRouter;