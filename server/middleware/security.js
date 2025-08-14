const validator = require('validator');
const rateLimit = require('express-rate-limit');
const DOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const path = require('path'); // Added missing import for path

// Create a DOM environment for DOMPurify
const window = new JSDOM('').window;
const purify = DOMPurify(window);

// Enhanced input sanitization middleware
const sanitizeInput = (req, res, next) => {
  // Enhanced string sanitization
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    
    // Remove all HTML tags and scripts
    str = purify.sanitize(str, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
    
    // Remove potential XSS attacks
    str = str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    str = str.replace(/javascript:/gi, '');
    str = str.replace(/vbscript:/gi, '');
    str = str.replace(/on\w+\s*=/gi, '');
    str = str.replace(/data:/gi, '');
    str = str.replace(/expression\s*\(/gi, '');
    
    // Remove SQL injection patterns
    str = str.replace(/union\s+select/gi, '');
    str = str.replace(/select\s+from/gi, '');
    str = str.replace(/insert\s+into/gi, '');
    str = str.replace(/delete\s+from/gi, '');
    str = str.replace(/update\s+set/gi, '');
    str = str.replace(/drop\s+table/gi, '');
    str = str.replace(/create\s+table/gi, '');
    
    // Remove NoSQL injection patterns
    str = str.replace(/\$where/gi, '');
    str = str.replace(/\$ne/gi, '');
    str = str.replace(/\$gt/gi, '');
    str = str.replace(/\$lt/gi, '');
    str = str.replace(/\$regex/gi, '');
    
    // Remove path traversal attempts
    str = str.replace(/\.\.\/|\.\.\\|\.\.%2f|\.\.%5c/gi, '');
    
    // Trim whitespace and normalize
    str = str.trim();
    str = str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    return str;
  };

  // Recursively sanitize object
  const sanitizeObject = (obj) => {
    if (obj === null || typeof obj !== 'object') {
      return typeof obj === 'string' ? sanitizeString(obj) : obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }

    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      // Sanitize key names as well
      const sanitizedKey = sanitizeString(key);
      sanitized[sanitizedKey] = sanitizeObject(value);
    }
    return sanitized;
  };

  // Sanitize request body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  // Sanitize URL parameters
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
};

// Enhanced input validation
const validateInput = {
  email: (email) => {
    if (!email || typeof email !== 'string') return false;
    return validator.isEmail(email) && email.length <= 254;
  },

  password: (password) => {
    if (!password || typeof password !== 'string') return false;
    // Enhanced password requirements
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return password.length >= 12 && 
           password.length <= 128 && 
           hasUpperCase && 
           hasLowerCase && 
           hasNumbers && 
           hasSpecialChar;
  },

  username: (username) => {
    if (!username || typeof username !== 'string') return false;
    // Stricter username validation
    return /^[a-zA-Z0-9_]{3,20}$/.test(username) && 
           !/^(admin|root|system|test|guest)$/i.test(username);
  },

  name: (name) => {
    if (!name || typeof name !== 'string') return false;
    // Enhanced name validation with Mongolian support
    return /^[a-zA-ZА-Яа-яЁёӨөҮүҺһ\s\-']{1,50}$/.test(name) &&
           name.trim().length >= 2;
  },

  text: (text, maxLength = 2000) => {
    if (!text || typeof text !== 'string') return false;
    // Check for suspicious patterns
    const suspiciousPatterns = [
      /<script/i, /javascript:/i, /vbscript:/i, /on\w+\s*=/i,
      /data:/i, /expression\s*\(/i, /union\s+select/i
    ];
    
    return text.length <= maxLength && 
           !suspiciousPatterns.some(pattern => pattern.test(text));
  },

  mongoId: (id) => {
    if (!id || typeof id !== 'string') return false;
    return validator.isMongoId(id);
  },

  // New validation methods
  url: (url) => {
    if (!url || typeof url !== 'string') return false;
    return validator.isURL(url, { 
      protocols: ['http', 'https'], 
      require_protocol: true 
    });
  },

  phone: (phone) => {
    if (!phone || typeof phone !== 'string') return false;
    return /^\+?[\d\s\-\(\)]{8,20}$/.test(phone);
  },

  date: (date) => {
    if (!date) return false;
    const dateObj = new Date(date);
    return dateObj instanceof Date && !isNaN(dateObj);
  }
};

// Enhanced file upload security
const validateFileUpload = (req, res, next) => {
  if (!req.files && !req.file) return next();

  const allowedMimeTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'
  ];

  const maxFileSize = parseInt(process.env.MAX_FILE_SIZE) || 25 * 1024 * 1024; // Reduced to 25MB
  const maxFiles = parseInt(process.env.MAX_FILES) || 5;

  const files = req.files ? (Array.isArray(req.files) ? req.files : Object.values(req.files).flat()) : [req.file];

  // Check file count
  if (files.length > maxFiles) {
    return res.status(400).json({
      success: false,
      message: `Maximum ${maxFiles} files allowed per upload`
    });
  }

  for (const file of files) {
    if (!file) continue;

    // Check file size
    if (file.size > maxFileSize) {
      return res.status(400).json({
        success: false,
        message: `File size exceeds ${Math.round(maxFileSize / 1024 / 1024)}MB limit`
      });
    }

    // Check MIME type
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: 'File type not allowed'
      });
    }

    // Enhanced file extension validation
    if (file.originalname) {
      const dangerousExtensions = [
        '.exe', '.bat', '.cmd', '.scr', '.pif', '.jar', '.js', '.vbs',
        '.php', '.asp', '.aspx', '.jsp', '.pl', '.py', '.rb', '.sh'
      ];
      const fileExt = file.originalname.toLowerCase();
      
      if (dangerousExtensions.some(ext => fileExt.endsWith(ext))) {
        return res.status(400).json({
          success: false,
          message: 'File type not allowed for security reasons'
        });
      }

      // Validate file extension matches MIME type
      const allowedExtensions = {
        'image/jpeg': ['.jpg', '.jpeg'],
        'image/png': ['.png'],
        'image/webp': ['.webp'],
        'image/gif': ['.gif'],
        'video/mp4': ['.mp4'],
        'video/webm': ['.webm'],
        'video/quicktime': ['.mov', '.qt'],
        'video/x-msvideo': ['.avi']
      };

      const expectedExtensions = allowedExtensions[file.mimetype] || [];
      const fileExtension = path.extname(file.originalname).toLowerCase();
      
      if (!expectedExtensions.includes(fileExtension)) {
        return res.status(400).json({
          success: false,
          message: 'File extension does not match file type'
        });
      }
    }

    // Additional security checks
    if (file.buffer) {
      // Check file magic numbers (file signatures)
      const magicNumbers = {
        'image/jpeg': [0xFF, 0xD8, 0xFF],
        'image/png': [0x89, 0x50, 0x4E, 0x47],
        'image/gif': [0x47, 0x49, 0x46],
        'image/webp': [0x52, 0x49, 0x46, 0x46],
        'video/mp4': [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70],
        'video/webm': [0x1A, 0x45, 0xDF, 0xA3],
        'video/quicktime': [0x00, 0x00, 0x00, 0x14, 0x66, 0x74, 0x79, 0x70]
      };

      const expectedMagic = magicNumbers[file.mimetype];
      if (expectedMagic && file.buffer.length >= expectedMagic.length) {
        const fileMagic = Array.from(file.buffer.slice(0, expectedMagic.length));
        const isValidMagic = expectedMagic.every((byte, index) => fileMagic[index] === byte);
        
        if (!isValidMagic) {
          return res.status(400).json({
            success: false,
            message: 'File content does not match declared type'
          });
        }
      }
    }
  }

  next();
};

// Enhanced security logging
const securityLogger = (req, res, next) => {
  const startTime = Date.now();
  const clientIP = req.ip || req.connection.remoteAddress;
  
  // Enhanced suspicious pattern detection
  const suspiciousPatterns = [
    /(\<|\%3C).*script.*(\>|\%3E)/i,
    /(\<|\%3C).*iframe.*(\>|\%3E)/i,
    /(\<|\%3C).*object.*(\>|\%3E)/i,
    /(\<|\%3C).*embed.*(\>|\%3E)/i,
    /javascript:/i, /vbscript:/i, /data:/i,
    /onload=/i, /onerror=/i, /onclick=/i,
    /\.\.\/|\.\.\\|\.\.%2f|\.\.%5c/i,
    /union.*select/i, /select.*from/i, /insert.*into/i,
    /delete.*from/i, /update.*set/i, /drop.*table/i,
    /\$where/i, /\$ne/i, /\$gt/i, /\$lt/i, /\$regex/i,
    /expression\s*\(/i, /eval\s*\(/i, /setTimeout\s*\(/i
  ];

  const requestContent = JSON.stringify({
    url: req.url,
    method: req.method,
    body: req.body,
    query: req.query,
    headers: req.headers
  });

  const suspicious = suspiciousPatterns.some(pattern => pattern.test(requestContent));

  if (suspicious) {
    console.warn(`🚨 SECURITY ALERT: Suspicious request detected`, {
      ip: clientIP,
      userAgent: req.get('User-Agent'),
      url: req.url,
      method: req.method,
      timestamp: new Date().toISOString(),
      suspiciousPatterns: suspiciousPatterns.filter(pattern => pattern.test(requestContent))
    });

    // Log to security monitoring system
    // You can integrate with external security services here
  }

  // Log response time and status
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    
    if (duration > 5000) {
      console.warn(`⏱️ SLOW REQUEST: ${req.method} ${req.url} took ${duration}ms`);
    }

    if (statusCode >= 400) {
      console.warn(`⚠️ ERROR REQUEST: ${req.method} ${req.url} - ${statusCode}`);
    }

    // Log security events
    if (suspicious || statusCode >= 400) {
      console.log(`🔒 SECURITY LOG: ${req.method} ${req.url} - IP: ${clientIP} - Status: ${statusCode} - Duration: ${duration}ms`);
    }
  });

  next();
};

// Enhanced rate limiting for different operations
const createRateLimiter = (windowMs, max, message, skipSuccessful = false) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message: message || 'Too many requests. Please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: skipSuccessful,
    keyGenerator: (req) => {
      // Use IP + user agent for better rate limiting
      return `${req.ip}-${req.get('User-Agent')}`;
    },
    handler: (req, res) => {
      console.warn(`🚫 RATE LIMIT EXCEEDED: ${req.ip} - ${req.method} ${req.url}`);
      res.status(429).json({
        success: false,
        message: message || 'Too many requests. Please try again later.',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
  });
};

// Different rate limiters for different operations
const authLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  5, // 5 attempts
  'Too many authentication attempts. Please try again in 15 minutes.'
);

const sensitiveOperationLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  3, // 3 attempts
  'Too many sensitive operations. Please try again in 15 minutes.'
);

const fileUploadLimiter = createRateLimiter(
  60 * 60 * 1000, // 1 hour
  10, // 10 uploads
  'Too many file uploads. Please try again in 1 hour.'
);

const apiLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  100, // 100 requests
  'Too many API requests. Please try again in 15 minutes.',
  true
);

// CSRF protection middleware
const csrfProtection = (req, res, next) => {
  // Skip CSRF for GET requests
  if (req.method === 'GET') return next();

  const token = req.headers['x-csrf-token'] || req.headers['csrf-token'];
  const sessionToken = req.session?.csrfToken;

  if (!token || !sessionToken || token !== sessionToken) {
    return res.status(403).json({
      success: false,
      message: 'CSRF token validation failed'
    });
  }

  next();
};

// Content Security Policy middleware
const cspMiddleware = (req, res, next) => {
  const cspHeader = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "media-src 'self' https: blob:",
    "connect-src 'self' https://chatli-production.up.railway.app wss://chatli-production.up.railway.app",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');

  res.setHeader('Content-Security-Policy', cspHeader);
  next();
};

module.exports = {
  sanitizeInput,
  validateInput,
  validateFileUpload,
  securityLogger,
  authLimiter,
  sensitiveOperationLimiter,
  fileUploadLimiter,
  apiLimiter,
  csrfProtection,
  cspMiddleware
}; 