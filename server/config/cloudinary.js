const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

console.log('Cloudinary configured with cloud_name:', process.env.CLOUDINARY_CLOUD_NAME || 'your-cloud-name');

// Upload image to Cloudinary
const uploadImage = async (file, folder = 'messenger/images') => {
  try {
    // Use file.path for the file path string
    const filePath = file.path || file;
    
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      resource_type: 'image',
      transformation: [
        { width: 800, height: 600, crop: 'limit' },
        { quality: 'auto' }
      ]
    });
    
    return {
      secure_url: result.secure_url,
      public_id: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes
    };
  } catch (error) {
    throw new Error('Image upload failed: ' + error.message);
  }
};

// Upload video to Cloudinary
const uploadVideo = async (file, folder = 'messenger/videos') => {
  try {
    // Use file.path for the file path string
    const filePath = file.path || file;
    
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      resource_type: 'video',
      transformation: [
        { width: 800, height: 600, crop: 'limit' }
      ]
    });
    
    return {
      secure_url: result.secure_url,
      public_id: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes
    };
  } catch (error) {
    throw new Error('Video upload failed: ' + error.message);
  }
};

// Delete file from Cloudinary
const deleteFile = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    throw new Error('File deletion failed: ' + error.message);
  }
};

// Get optimized URL
const getOptimizedUrl = (publicId, options = {}) => {
  return cloudinary.url(publicId, options);
};

// Extract public ID from URL
const extractPublicIdFromUrl = (url) => {
  try {
    if (!url || typeof url !== 'string') return null;
    
    // Extract public ID from Cloudinary URL
    const match = url.match(/\/v\d+\/([^\/]+)\./);
    return match ? match[1] : null;
  } catch (error) {
    console.error('Error extracting public ID:', error);
    return null;
  }
};

// Delete multiple files
const deleteMultipleFiles = async (urls) => {
  try {
    if (!Array.isArray(urls)) {
      urls = [urls];
    }
    
    const results = [];
    for (const url of urls) {
      if (url) {
        const publicId = extractPublicIdFromUrl(url);
        if (publicId) {
          try {
            await deleteFile(publicId);
            results.push({ url, success: true });
            console.log(`Successfully deleted file: ${url}`);
          } catch (error) {
            results.push({ url, success: false, error: error.message });
            console.error(`Failed to delete file: ${url}`, error);
          }
        } else {
          results.push({ url, success: false, error: 'Could not extract public ID' });
        }
      }
    }
    
    return results;
  } catch (error) {
    throw new Error('Multiple file deletion failed: ' + error.message);
  }
};

module.exports = {
  uploadImage,
  uploadVideo,
  deleteFile,
  getOptimizedUrl,
  extractPublicIdFromUrl,
  deleteMultipleFiles
}; 