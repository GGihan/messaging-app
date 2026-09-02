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

export const deleteAvatar = async (req, res) => {
  const userId = req.user?.id;

  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { avatarUrl: true },
  });

  if (!profile?.avatarUrl) {
    return res.json({
      success: true,
      message: 'Avatar is already removed.',
    });
  }

  const publicId = cloudinaryService.getPublicIdFromUrl(profile.avatarUrl);

  if (publicId) {
    try {
      await cloudinaryService.deleteFromCloud(publicId);
    } catch (cloudErr) {
      logger.error({ 
        err: cloudErr, 
        userId, publicId 
      }, 'Failed to delete asset from Cloudinary');
    }
  }

  const updatedProfile = await prisma.profile.update({
    where: { userId },
    data: { avatarUrl: null },
  });

  return res.json({
    success: true,
    message: 'Avatar has been removed.',
    data: { profile: updatedProfile },
  });
};