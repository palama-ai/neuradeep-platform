/**
 * Cloudinary Upload Service
 * Handles profile picture uploads to Cloudinary CDN.
 * 
 * Required .env variables:
 *   CLOUDINARY_CLOUD_NAME=your_cloud_name
 *   CLOUDINARY_API_KEY=your_api_key
 *   CLOUDINARY_API_SECRET=your_api_secret
 */

const cloudinary = require('cloudinary').v2;

// Configure from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload a base64 image to Cloudinary.
 * @param {string} base64Data - The full base64 string (with or without data URI prefix).
 * @param {string} userId - User ID for folder organization.
 * @returns {Promise<{url: string, publicId: string}>} - The secure URL and public ID.
 */
async function uploadAvatar(base64Data, userId) {
  // Ensure proper data URI format
  let imageData = base64Data;
  if (!imageData.startsWith('data:image/')) {
    imageData = `data:image/webp;base64,${imageData}`;
  }

  try {
    const result = await cloudinary.uploader.upload(imageData, {
      folder: 'palama/avatars',
      public_id: `user_${userId}`,
      overwrite: true,
      invalidate: true, // Force CDN refresh
      transformation: [
        { width: 256, height: 256, crop: 'fill', gravity: 'face' },
        { quality: 'auto', fetch_format: 'auto' }
      ]
    });

    console.log(`[Cloudinary] Successfully uploaded avatar for ${userId}: ${result.secure_url}`);

    return {
      url: result.secure_url,
      publicId: result.public_id
    };
  } catch (err) {
    console.error(`[Cloudinary] Upload failed for ${userId}:`, err.message);
    throw err;
  }
}

/**
 * Delete a user's avatar from Cloudinary.
 * @param {string} userId - User ID.
 */
async function deleteAvatar(userId) {
  try {
    await cloudinary.uploader.destroy(`palama/avatars/user_${userId}`);
  } catch (err) {
    console.error('[Cloudinary] Delete Error:', err.message);
  }
}

module.exports = { uploadAvatar, deleteAvatar };
