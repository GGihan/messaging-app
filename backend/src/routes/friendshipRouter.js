import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import {
  blockUser,
  deleteFriendship,
  getFriendships,
  sendFriendRequest,
  unblockUser,
  updateFriendship
} from "../controllers/friendshipController.js";
import {
  validateFriendshipQuery,
  validateReceiverBody,
  validateReceiverParam,
  validateStatus,
  validateUuidBody,
  validateUuidParam
} from "../middleware/validators.js";
import { handleValidation } from "../middleware/handleValidation.js";

const friendshipRouter = Router();

friendshipRouter.use(requireAuth);

friendshipRouter.get('/',
  validateFriendshipQuery,
  handleValidation,
  getFriendships
);

friendshipRouter.post('/requests',
  validateUuidBody('receiverId'),
  validateReceiverBody,
  handleValidation,
  sendFriendRequest
);

friendshipRouter.patch('/:friendshipId',
  validateUuidParam('friendshipId'),
  validateStatus,
  handleValidation,
  updateFriendship
);

friendshipRouter.delete('/:friendshipId',
  validateUuidParam('friendshipId'),
  handleValidation,
  deleteFriendship
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