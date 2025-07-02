# Cloudinary Setup Guide

This project now uses Cloudinary for efficient media storage instead of base64 encoding. Follow these steps to set up Cloudinary for your messenger app.

## 1. Create Cloudinary Account

1. Go to [Cloudinary](https://cloudinary.com) and sign up for a free account
2. After registration, you'll be redirected to your dashboard
3. Note down your **Cloud Name**, **API Key**, and **API Secret**

## 2. Configure Environment Variables

Update your `server/config.env` file with your Cloudinary credentials:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

**Important:** Never commit your actual API credentials to version control!

## 3. Cloudinary Features Enabled

### Automatic Optimization
- **Images**: Auto-quality, auto-format, max 1200x1200px
- **Videos**: Auto-quality, auto-format, max 1280x720px, 1Mbps bitrate
- **Avatars**: Optimized for profile pictures

### File Organization
- **Images**: `messenger/images/` folder
- **Videos**: `messenger/videos/` folder  
- **Avatars**: `messenger/avatars/` folder

### File Limits
- **Maximum file size**: 50MB (increased from 10MB)
- **Supported formats**: Images (JPEG, PNG, GIF, WebP) and Videos (MP4, MOV, AVI, etc.)

## 4. Benefits Over Base64

### Storage Efficiency
- **Base64**: 33% larger file size, stored in MongoDB
- **Cloudinary**: Original file size, URLs only in MongoDB

### Performance
- **Base64**: Slow database queries, large document sizes
- **Cloudinary**: Fast CDN delivery, small document sizes

### Features
- **Base64**: No optimization or transformations
- **Cloudinary**: Automatic optimization, responsive images, video transcoding

## 5. Testing the Integration

1. Start your server: `npm run dev` (in server directory)
2. Upload an image or video in a new post
3. Check your Cloudinary dashboard to see the uploaded files
4. Verify the MongoDB documents only contain URLs, not base64 data

## 6. Production Considerations

### Security
- Use environment variables for API credentials
- Consider signed uploads for additional security
- Set up upload presets for consistent transformations

### Performance
- Enable Cloudinary's auto-optimization features
- Use responsive image delivery
- Implement lazy loading for media

### Costs
- Free tier: 25GB storage, 25GB bandwidth/month
- Monitor usage in Cloudinary dashboard
- Consider paid plans for higher usage

## 7. Migration from Base64

If you have existing posts with base64 media, you can create a migration script to:

1. Extract base64 data from existing posts
2. Upload to Cloudinary
3. Replace base64 URLs with Cloudinary URLs
4. Update database records

## 8. Troubleshooting

### Common Issues
- **Upload fails**: Check API credentials and file size limits
- **Images don't display**: Verify Cloudinary URLs are accessible
- **Slow uploads**: Check internet connection and file sizes

### Debug Mode
Enable debug logging in development:
```javascript
// In server/config/cloudinary.js
cloudinary.config({
  // ... other config
  debug: process.env.NODE_ENV === 'development'
});
```

## 9. Advanced Features (Optional)

### Custom Transformations
```javascript
// Example: Create thumbnail versions
const thumbnail = cloudinary.url(publicId, {
  width: 150,
  height: 150,
  crop: 'thumb',
  gravity: 'face'
});
```

### Video Features
- Automatic format conversion (MP4, WebM)
- Video thumbnails
- Adaptive bitrate streaming

This setup provides a much more efficient and scalable media handling system compared to base64 storage! 