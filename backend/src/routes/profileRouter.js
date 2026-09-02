import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { validateUpdateProfile } from "../middleware/validators.js";
import { handleValidation } from "../middleware/handleValidation.js";
import { uploadImage } from "../middleware/multerUpload.js";
import { deleteAvatar, updateProfile } from "../controllers/profileController.js";

const profileRouter = Router();

profileRouter.use(requireAuth)

profileRouter.patch('/',
  uploadImage.single('avatar'),
  validateUpdateProfile,
  handleValidation,
  updateProfile
);

profileRouter.delete('/avatar', deleteAvatar)

export default profileRouter;