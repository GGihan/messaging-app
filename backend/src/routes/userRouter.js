import { Router } from 'express';
import { searchUser } from '../controllers/userController.js';
import { validateUserSearchQuery } from '../middleware/validators.js';
import { handleValidation } from '../middleware/handleValidation.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const userRouter = Router();

userRouter.use(requireAuth);

userRouter.get('/', validateUserSearchQuery, handleValidation, searchUser);

export default userRouter;