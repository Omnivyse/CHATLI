const crypto = require('crypto');

// Security configuration constants
const SECURITY_CONFIG = {
  // JWT Settings
  JWT: {
    ACCESS_TOKEN_EXPIRY: '2h',
    REFRESH_TOKEN_EXPIRY: '7d',
    ALGORITHM: 'HS256',
    AUDIENCE: 'chatli-app',
    REFRESH_AUDIENCE: 'chatli-refresh',
    ISSUER: 'chatli-server'
  },

  // Password Settings
  PASSWORD: {
    MIN_LENGTH: 12,
    MAX_LENGTH: 128,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SPECIAL_CHARS: true,
    SALT_ROUNDS: 12
  },

  // Rate Limiting
  RATE_LIMITS: {
    AUTH: { windowMs: 15 * 60 * 1000, max: 5 }, // 5 attempts per 15 minutes
    SENSITIVE: { windowMs: 15 * 60 * 1000, max: 3 }, // 3 attempts per 15 minutes
    FILE_UPLOAD: { windowMs: 60 * 60 * 1000, max: 10 }, // 10 uploads per hour
    API: { windowMs: 15 * 60 * 1000, max: 100 }, // 100 requests per 15 minutes
    SOCKET: { windowMs: 60 * 1000, max: 30 } // 30 events per minute
  },

  // File Upload Security
  FILE_UPLOAD: {
    MAX_FILE_SIZE: 25 * 1024 * 1024, // 25MB
    MAX_FILES: 5,
    ALLOWED_MIME_TYPES: [
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
      'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'
    ],
    DANGEROUS_EXTENSIONS: [
      '.exe', '.bat', '.cmd', '.scr', '.pif', '.jar', '.js', '.vbs',
      '.php', '.asp', '.aspx', '.jsp', '.pl', '.py', '.rb', '.sh'
    ]
  },

  // Input Validation
  VALIDATION: {
    MAX_SEARCH_QUERY_LENGTH: 50,
    MAX_USERNAME_LENGTH: 20,
    MAX_NAME_LENGTH: 50,
    MAX_BIO_LENGTH: 500,
    MAX_POST_CONTENT_LENGTH: 2000,
    MAX_COMMENT_LENGTH: 1000
  },

  // Session Security
  SESSION: {
    MAX_ACTIVE_SESSIONS: 5,
    SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
    FORCE_LOGOUT_ON_PASSWORD_CHANGE: true
  },

  // CORS Settings
  CORS: {
    ALLOWED_ORIGINS: [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://www.chatli.mn',
      'https://chatli.mn',
      'https://chatli.vercel.app',
      'https://chatli-mobile.vercel.app'
    ],
    ALLOWED_METHODS: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    ALLOWED_HEADERS: [
      'Content-Type', 
      'Authorization', 
      'X-Requested-With', 
      'X-Device-Fingerprint', 
      'X-CSRF-Token'
    ],
    CREDENTIALS: true,
    MAX_AGE: 86400 // 24 hours
  },

  // Content Security Policy
  CSP: {
    DIRECTIVES: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      mediaSrc: ["'self'", "https:", "blob:"],
      connectSrc: [
        "'self'", 
        "https://chatli-production.up.railway.app", 
        "wss://chatli-production.up.railway.app"
      ],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
    }
  },

  // Security Headers
  HEADERS: {
    X_CONTENT_TYPE_OPTIONS: 'nosniff',
    X_FRAME_OPTIONS: 'DENY',
    X_XSS_PROTECTION: '1; mode=block',
    REFERRER_POLICY: 'strict-origin-when-cross-origin',
    PERMISSIONS_POLICY: 'geolocation=(), microphone=(), camera=()',
    X_PERMITTED_CROSS_DOMAIN_POLICIES: 'none'
  },

  // MongoDB Security
  MONGODB: {
    MAX_POOL_SIZE: 10,
    SERVER_SELECTION_TIMEOUT: 5000,
    SOCKET_TIMEOUT: 45000,
    SSL: process.env.NODE_ENV === 'production',
    SSL_VALIDATE: process.env.NODE_ENV === 'production',
    MONITOR_COMMANDS: true,
    BUFFER_COMMANDS: false,
    BUFFER_MAX_ENTRIES: 0
  },

  // Socket.IO Security
  SOCKET_IO: {
    MAX_HTTP_BUFFER_SIZE: 1 * 1024 * 1024, // 1MB
    PING_TIMEOUT: 60000,
    PING_INTERVAL: 25000,
    UPGRADE_TIMEOUT: 10000,
    ALLOW_EIO3: true
  }
};

// Security utility functions
const SecurityUtils = {
  // Generate secure random string
  generateSecureString: (length = 32) => {
    return crypto.randomBytes(length).toString('hex');
  },

  // Generate secure random number
  generateSecureNumber: (min, max) => {
    const range = max - min;
    const bytes = crypto.randomBytes(4);
    const value = bytes.readUInt32BE(0);
    return min + (value % range);
  },

  // Hash sensitive data
  hashData: (data, salt = null) => {
    if (!salt) {
      salt = crypto.randomBytes(16).toString('hex');
    }
    const hash = crypto.pbkdf2Sync(data, salt, 1000, 64, 'sha512');
    return { hash: hash.toString('hex'), salt };
  },

  // Verify hashed data
  verifyHash: (data, hash, salt) => {
    const verifyHash = crypto.pbkdf2Sync(data, salt, 1000, 64, 'sha512');
    return crypto.timingSafeEqual(
      Buffer.from(hash, 'hex'),
      verifyHash
    );
  },

  // Generate device fingerprint
  generateDeviceFingerprint: (userAgent, ip) => {
    const data = `${userAgent}|${ip}|${Date.now()}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  },

  // Validate email format
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  },

  // Validate password strength
  validatePasswordStrength: (password) => {
    if (password.length < SECURITY_CONFIG.PASSWORD.MIN_LENGTH) {
      return { valid: false, message: 'Password too short' };
    }
    if (password.length > SECURITY_CONFIG.PASSWORD.MAX_LENGTH) {
      return { valid: false, message: 'Password too long' };
    }
    if (SECURITY_CONFIG.PASSWORD.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
      return { valid: false, message: 'Password must contain uppercase letter' };
    }
    if (SECURITY_CONFIG.PASSWORD.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
      return { valid: false, message: 'Password must contain lowercase letter' };
    }
    if (SECURITY_CONFIG.PASSWORD.REQUIRE_NUMBERS && !/\d/.test(password)) {
      return { valid: false, message: 'Password must contain number' };
    }
    if (SECURITY_CONFIG.PASSWORD.REQUIRE_SPECIAL_CHARS && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return { valid: false, message: 'Password must contain special character' };
    }
    return { valid: true, message: 'Password is strong' };
  },

  // Sanitize HTML content
  sanitizeHTML: (html) => {
    // Basic HTML sanitization - remove dangerous tags and attributes
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/vbscript:/gi, '')
      .replace(/data:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  },

  // Validate file type by magic numbers
  validateFileType: (buffer, expectedMimeType) => {
    const magicNumbers = {
      'image/jpeg': [0xFF, 0xD8, 0xFF],
      'image/png': [0x89, 0x50, 0x4E, 0x47],
      'image/gif': [0x47, 0x49, 0x46],
      'image/webp': [0x52, 0x49, 0x46, 0x46],
      'video/mp4': [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70],
      'video/webm': [0x1A, 0x45, 0xDF, 0xA3],
      'video/quicktime': [0x00, 0x00, 0x00, 0x14, 0x66, 0x74, 0x79, 0x70]
    };

    const expectedMagic = magicNumbers[expectedMimeType];
    if (!expectedMagic || buffer.length < expectedMagic.length) {
      return false;
    }

    const fileMagic = Array.from(buffer.slice(0, expectedMagic.length));
    return expectedMagic.every((byte, index) => fileMagic[index] === byte);
  },

  // Check for suspicious patterns
  detectSuspiciousPatterns: (input) => {
    const patterns = [
      /<script/i, /javascript:/i, /vbscript:/i, /data:/i,
      /on\w+\s*=/i, /expression\s*\(/i, /eval\s*\(/i,
      /union\s+select/i, /select\s+from/i, /insert\s+into/i,
      /delete\s+from/i, /update\s+set/i, /drop\s+table/i,
      /\$where/i, /\$ne/i, /\$gt/i, /\$lt/i, /\$regex/i,
      /\.\.\/|\.\.\\|\.\.%2f|\.\.%5c/i
    ];

    return patterns.some(pattern => pattern.test(input));
  },

  // Rate limiting helper
  createRateLimitKey: (req) => {
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent') || 'unknown';
    return `${ip}-${userAgent}`;
  },

  // Log security event
  logSecurityEvent: (event, details) => {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      event,
      details,
      severity: details.severity || 'info'
    };

    console.log(`🔒 SECURITY LOG [${timestamp}]: ${event}`, logEntry);
    
    // TODO: Send to external security monitoring service
    // You can integrate with services like:
    // - Sentry
    // - LogRocket
    // - Custom security monitoring system
  }
};

// Export configuration and utilities
module.exports = {
  SECURITY_CONFIG,
  SecurityUtils
};
