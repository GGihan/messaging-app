import { matchedData } from "express-validator";
import { profileService } from "../services/profileService.js";

export const updateProfile = async (req, res) => {
  const userId = req.user?.id;
  const fileBuffer = req.file?.buffer;
  const { displayName, bio } = matchedData(req);

  const updatedProfile = await profileService.updateProfile(userId, {
    displayName,
    bio,
    fileBuffer,
  });

  res.json({
    success: true,
    data: {
      profile: updatedProfile,
    },
  });
};

export const deleteAvatar = async (req, res) => {
  const userId = req.user.id;

  const updatedProfile = await profileService.deleteAvatar(userId);

  return res.json({
    success: true,
    message: 'Avatar has been removed.',
    data: {
      profile: updatedProfile 
    },
  });
};