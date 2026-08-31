import "dotenv/config";
import { v2 as cloudinary } from 'cloudinary';
import { isDevelopment, isTest } from "../src/config/env.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const BASE_FOLDER = isTest
  ? 'messaging-app/test'
  : isDevelopment
  ? 'messaging-app/dev'
  : 'messaging-app';

// Streams a buffer to Cloudinary with given options.
function uploadBuffer(fileBuffer, options = {}) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });

    stream.end(fileBuffer);
  });
};

// Presets for image uploading
function uploadAvatarToCloud(fileBuffer, { folder, publicId } = {}) {
  return uploadBuffer(fileBuffer, {
    folder,
    public_id: publicId,
    overwrite: true,
    invalidate: true,
    transformation: [
      { width: 300, height: 300, crop: 'fill', gravity: 'center' },
      { fetch_format: 'auto', quality: 'auto' },
    ],
  });
};

function uploadMessageImageToCloud(fileBuffer, { folder } = {}) {
  return uploadBuffer(fileBuffer, {
    folder,
    overwrite: false,
    transformation: [
      { width: 1200, height: 1200, crop: 'limit' },
      { fetch_format: 'auto', quality: 'auto' },
    ],
  });
};

// Domain specific wrapper functions
export function uploadUserAvatar(fileBuffer, userId) {
  return uploadAvatarToCloud(fileBuffer, {
    folder: `${BASE_FOLDER}/users`,
    publicId: userId,
  });
};

export function uploadChatAvatar(fileBuffer, chatId) {
  return uploadAvatarToCloud(fileBuffer, {
    folder: `${BASE_FOLDER}/chats`,
    publicId: chatId,
  });
};

export function uploadMessageAttachment(fileBuffer, chatId) {
  return uploadMessageImageToCloud(fileBuffer, {
    folder: `${BASE_FOLDER}/messages/${chatId}`,
  });
};

// Utility
export async function deleteFromCloud(publicId) {
  return await cloudinary.uploader.destroy(publicId);
};

export function getPublicIdFromUrl(url) {
  if (!url || typeof url !== 'string') return null;

  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^/.]+)?$/);

  return match ? match[1] : null;
};