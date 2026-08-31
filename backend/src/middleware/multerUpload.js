import multer from "multer";

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
      cb(new Error(`Only image files are allowed!`), false);
    }
  }
});