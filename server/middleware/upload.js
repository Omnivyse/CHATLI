const multer = require('multer');

// Simple memory storage for now - will work on Railway
const storage = multer.memoryStorage();

// Configure multer upload with memory storage
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Зөвхөн зургийн файл оруулна уу'), false);
    }
  }
});

module.exports = upload; 