import multer from "multer";
import { BadRequestError } from "../errors/AppError.js";

// Configure Multer to hold files in temporary RAM first
const storage = multer.memoryStorage();

// Initialize the Multer middleware instance with options for safety
export const uploadImage = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new BadRequestError(`Only image files are allowed!`), false);
    }
  }
});