import { matchedData } from "express-validator";
import { prisma } from "../../lib/prisma.js";
import { cloudinaryService } from "../../lib/cloudinary.js";
import { logger } from "../../lib/logger.js";

export const updateProfile = async (req, res) => {
  const { displayName, bio } = matchedData(req);
  const userId = req.user?.id;

  const profile = await prisma.profile.findUnique({
    where: { userId },
  });

  let currentAvatarUrl = profile?.avatarUrl;

  if (req.file) {
    let uploadResult;
    try {
      uploadResult = await cloudinaryService.uploadUserAvatar(req.file.buffer, userId);
      currentAvatarUrl = uploadResult.secure_url;
    } catch (uploadError) {
      logger.error({
        err: uploadError,
        userId,
        context: 'profile_avatar_upload',
      }, 'Failed to upload avatar to Cloudinary');
      return res.status(502).json({
        success: false,
        message: 'Image upload failed. Please try again later.',
      });
    }
  }

  const updatedProfile = await prisma.profile.update({
    where: { userId },
    data: {
      displayName,
      bio,
      avatarUrl: currentAvatarUrl,
    },
  });

  res.json({
    success: true,
    data: {
      profile: updatedProfile,
    },
  })
};