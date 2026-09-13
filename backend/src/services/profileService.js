import { prisma } from "../../lib/prisma.js";
import { NotFoundError } from "../errors/AppError.js";
import { cloudinaryService } from "./cloudinaryService.js";

export const profileService = {
  async updateProfile(userId, { displayName, bio, fileBuffer }) {
    const updateData = {
      displayName,
      bio,
    };

    if (fileBuffer) {
      const uploadResult = await cloudinaryService.uploadUserAvatar(fileBuffer, userId);
      updateData.avatarUrl = uploadResult.secure_url;
    }

    const updatedProfile = await prisma.profile.update({
      where: { userId },
      data: updateData,
    });

    return updatedProfile;
  },

  async deleteAvatar(userId) {
    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: { avatarUrl: true },
    });

    if (!profile) {
      throw new NotFoundError('Profile not found');
    }

    if (!profile.avatarUrl) {
      return profile;
    }

    const oldAvatarUrl = profile?.avatarUrl;

    const updatedProfile = await prisma.profile.update({
      where: { userId },
      data: { avatarUrl: null },
    });

    const publicId = cloudinaryService.getPublicIdFromUrl(oldAvatarUrl);
    if (publicId) {
      cloudinaryService.deleteFromCloud(publicId).catch(() => null);
    }

    return updatedProfile;
  },
};