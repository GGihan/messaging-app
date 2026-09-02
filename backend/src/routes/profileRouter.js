import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { validateUpdateProfile } from "../middleware/validators.js";
import { handleValidation } from "../middleware/handleValidation.js";
import { uploadImage } from "../middleware/multerUpload.js";
import { updateProfile } from "../controllers/profileController.js";

const profileRouter = Router();

profileRouter.patch('/',
  requireAuth,
  uploadImage.single('avatar'),
  validateUpdateProfile,
  handleValidation,
  updateProfile
);

export default profileRouter;