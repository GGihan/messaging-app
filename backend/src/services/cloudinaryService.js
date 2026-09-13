import { uploadBuffer, cloudinary } from '../../lib/cloudinary.js';
import { isDevelopment, isTest } from '../config/env.js';
import { logger } from '../../lib/logger.js';
import { BadGatewayError } from '../errors/AppError.js';

const BASE_FOLDER = isTest
  ? 'messaging-app/test'
  : isDevelopment
  ? 'messaging-app/dev'
  : 'messaging-app';

// Internal helper wrapping uploadBuffer with centralized error catching & logging
async function executeUpload(fileBuffer, options, contextMetadata) {
  try {
    return await uploadBuffer(fileBuffer, options);
  } catch (err) {
    logger.error(
      {
        err,
        ...contextMetadata,
      },
      'Cloudinary upload failed'
    );
    throw new BadGatewayError('Image upload failed');
  }
}

export async function uploadUserAvatar(fileBuffer, userId) {
  return executeUpload(
    fileBuffer,
    {
      folder: `${BASE_FOLDER}/users`,
      public_id: userId,
      overwrite: true,
      invalidate: true,
      transformation: [
        { width: 300, height: 300, crop: 'fill', gravity: 'center' },
        { fetch_format: 'auto', quality: 'auto' },
      ],
    },
    { userId, context: 'user_avatar_upload' }
  );
}

export async function uploadChatAvatar(fileBuffer, chatId) {
  return executeUpload(
    fileBuffer,
    {
      folder: `${BASE_FOLDER}/chats`,
      public_id: chatId,
      overwrite: true,
      invalidate: true,
      transformation: [
        { width: 300, height: 300, crop: 'fill', gravity: 'center' },
        { fetch_format: 'auto', quality: 'auto' },
      ],
    },
    { chatId, context: 'chat_avatar_upload' }
  );
}

export async function uploadMessageAttachment(fileBuffer, chatId) {
  return executeUpload(
    fileBuffer,
    {
      folder: `${BASE_FOLDER}/messages/${chatId}`,
      overwrite: false,
      transformation: [
        { width: 1200, height: 1200, crop: 'limit' },
        { fetch_format: 'auto', quality: 'auto' },
      ],
    },
    { chatId, context: 'message_attachment_upload' }
  );
}

export async function deleteFromCloud(publicId) {
  try {
    return await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    logger.error({ err, publicId }, 'Failed to delete asset from Cloudinary');
    throw new BadGatewayError('Failed to remove asset from storage.');
  }
}

export function getPublicIdFromUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^/.]+)?$/);
  return match ? match[1] : null;
}

export const cloudinaryService = {
  uploadUserAvatar,
  uploadChatAvatar,
  uploadMessageAttachment,
  deleteFromCloud,
  getPublicIdFromUrl,
};