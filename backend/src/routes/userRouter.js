import { Router } from 'express';
import { searchUser } from '../controllers/userController.js';
import { validateUserSearchQuery } from '../middleware/validators.js';
import { handleValidation } from '../middleware/handleValidation.js';

const userRouter = Router();

userRouter.get('/', validateUserSearchQuery, handleValidation, searchUser);

export default userRouter;