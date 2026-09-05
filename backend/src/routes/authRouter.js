import { Router } from 'express';
import { validateLogIn, validateRegister } from '../middleware/validators.js';
import { handleValidation } from '../middleware/handleValidation.js';
import { getMe, loginUser, logoutUser, registerUser } from '../controllers/authController.js';

const authRouter = Router();

authRouter.post('/register', validateRegister, handleValidation, registerUser);

authRouter.post('/login', validateLogIn, handleValidation, loginUser);

authRouter.post('/logout', logoutUser);

authRouter.get('/me', getMe);

export default authRouter;