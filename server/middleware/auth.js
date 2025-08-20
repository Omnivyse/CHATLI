const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');

// Enhanced JWT token generation with security claims
const generateSecureToken = (userId, deviceInfo = {}) => {
  const tokenId = uuidv4(); // Unique token identifier
  const now = Math.floor(Date.now() / 1000);
  
  const payload = {
    userId,
    jti: tokenId, // JWT ID - unique identifier
    iat: now, // Issued at
    aud: 'chatli-app', // Audience
    iss: 'chatli-server', // Issuer
    sub: userId.toString(), // Subject
    device: {
      fingerprint: deviceInfo.fingerprint || 'unknown',
      userAgent: deviceInfo.userAgent || 'unknown',
      ip: deviceInfo.ip || 'unknown'
    }
  };

  return jwt.sign(payload, process.env.JWT_SECRET, { 
    expiresIn: '2h', // Reduced from 7 days to 2 hours
    algorithm: 'HS256'
  });
};

// Generate refresh token for longer sessions
const generateRefreshToken = (userId, deviceInfo = {}) => {
  const tokenId = uuidv4();
  const now = Math.floor(Date.now() / 1000);
  
  const payload = {
    userId,
    jti: tokenId,
    iat: now,
    aud: 'chatli-refresh',
    iss: 'chatli-server',
    sub: userId.toString(),
    type: 'refresh',
    device: {
      fingerprint: deviceInfo.fingerprint || 'unknown',
      userAgent: deviceInfo.userAgent || 'unknown',
      ip: deviceInfo.ip || 'unknown'
    }
  };

  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, { 
    expiresIn: '7d',
    algorithm: 'HS256'
  });
};

// Enhanced authentication middleware with backward compatibility
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication token required',
        code: 'TOKEN_MISSING'
      });
    }

    // Verify token structure
    if (!token.includes('.')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token format',
        code: 'TOKEN_INVALID_FORMAT'
      });
    }

    // Decode token without verification first to check claims
    let decoded;
    try {
      decoded = jwt.decode(token);
    } catch (error) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token structure',
        code: 'TOKEN_INVALID_STRUCTURE'
      });
    }

    // Check if token is expired
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token has expired',
        code: 'TOKEN_EXPIRED'
      });
    }

    // Verify token signature
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid token signature',
          code: 'TOKEN_INVALID_SIGNATURE'
        });
      }
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          success: false, 
          message: 'Token has expired',
          code: 'TOKEN_EXPIRED'
        });
      }
      
      throw error;
    }

    // Backward compatibility: Handle both old and new token formats
    let isValidToken = true;
    let missingClaims = [];

    // Check for required claims with backward compatibility
    if (!decoded.userId) {
      // Old token format might use 'id' instead of 'userId'
      if (decoded.id) {
        decoded.userId = decoded.id;
      } else {
        isValidToken = false;
        missingClaims.push('userId');
      }
    }

    // For new tokens, require all claims; for old tokens, be more lenient
    if (decoded.aud && decoded.iss && decoded.jti) {
      // New token format - validate all claims
      if (decoded.aud !== 'chatli-app') {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid token audience',
          code: 'TOKEN_INVALID_AUDIENCE'
        });
      }

      if (decoded.iss !== 'chatli-server') {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid token issuer',
          code: 'TOKEN_INVALID_ISSUER'
        });
      }
    } else {
      // Old token format - log warning but allow
      console.log(`⚠️ Old token format detected for user ${decoded.userId}. Token will be accepted but should be refreshed.`);
      
      // Add missing claims for consistency
      if (!decoded.jti) decoded.jti = 'legacy-' + Date.now();
      if (!decoded.aud) decoded.aud = 'chatli-app';
      if (!decoded.iss) decoded.iss = 'chatli-server';
    }

    if (!isValidToken) {
      return res.status(401).json({ 
        success: false, 
        message: `Token missing required claims: ${missingClaims.join(', ')}`,
        code: 'TOKEN_INVALID_CLAIMS'
      });
    }

    // Find user and check if still exists
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Check if user account is still active
    if (user.deletedAt) {
      return res.status(401).json({ 
        success: false, 
        message: 'Account has been deleted',
        code: 'ACCOUNT_DELETED'
      });
    }

    // Check if password was changed after token was issued
    if (user.passwordChangedAt) {
      const passwordChangedAt = new Date(user.passwordChangedAt).getTime() / 1000;
      if (decoded.iat < passwordChangedAt) {
        return res.status(401).json({ 
          success: false, 
          message: 'Password changed. Please login again.',
          code: 'PASSWORD_CHANGED'
        });
      }
    }

    // Check if user is banned or suspended
    if (user.status === 'banned' || user.status === 'suspended') {
      return res.status(403).json({ 
        success: false, 
        message: 'Account is restricted',
        code: 'ACCOUNT_RESTRICTED'
      });
    }

    // Add user and token info to request
    req.user = user;
    req.token = {
      id: decoded.jti,
      issuedAt: decoded.iat,
      expiresAt: decoded.exp,
      device: decoded.device || { fingerprint: 'unknown', userAgent: 'unknown', ip: 'unknown' },
      isLegacy: !decoded.aud || !decoded.iss || !decoded.jti
    };

    // Log successful authentication for security monitoring
    console.log(`🔐 User authenticated: ${user.username} (${user._id}) - Token: ${decoded.jti} - IP: ${req.ip} - Legacy: ${req.token.isLegacy}`);

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Authentication failed',
      code: 'AUTH_ERROR'
    });
  }
};

// Optional authentication middleware - doesn't require token
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      try {
        // Use the same validation logic as required auth with backward compatibility
        const decoded = jwt.decode(token);
        
        if (decoded && decoded.exp && decoded.exp >= Math.floor(Date.now() / 1000)) {
          const verified = jwt.verify(token, process.env.JWT_SECRET);
          
          // Backward compatibility: Handle both old and new token formats
          if (verified && (verified.userId || verified.id)) {
            const userId = verified.userId || verified.id;
            const user = await User.findById(userId).select('-password');
            
            if (user && !user.deletedAt && user.status !== 'banned' && user.status !== 'suspended') {
              req.user = user;
              req.token = {
                id: verified.jti || 'legacy-' + Date.now(),
                issuedAt: verified.iat,
                expiresAt: verified.exp,
                device: verified.device || { fingerprint: 'unknown', userAgent: 'unknown', ip: 'unknown' },
                isLegacy: !verified.aud || !verified.iss || !verified.jti
              };
            }
          }
        }
      } catch (error) {
        // Silently ignore token errors for optional auth
        console.log('Optional auth token error (ignored):', error.message);
      }
    }
    
    next();
  } catch (error) {
    // Always continue for optional auth
    next();
  }
};
   
// Refresh token middleware for longer sessions
const refreshAuth = async (req, res, next) => {
  try {
    const refreshToken = req.header('X-Refresh-Token');
    
    if (!refreshToken) {
      return res.status(401).json({ 
        success: false, 
        message: 'Refresh token required',
        code: 'REFRESH_TOKEN_MISSING'
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    
    if (decoded.type !== 'refresh' || decoded.aud !== 'chatli-refresh') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid refresh token',
        code: 'REFRESH_TOKEN_INVALID'
      });
    }

    // Check if user still exists
    const user = await User.findById(decoded.userId).select('-password');
    if (!user || user.deletedAt || user.status === 'banned' || user.status === 'suspended') {
      return res.status(401).json({ 
        success: false, 
        message: 'User account invalid',
        code: 'USER_INVALID'
      });
    }

    req.user = user;
    req.refreshToken = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Refresh token expired',
        code: 'REFRESH_TOKEN_EXPIRED'
      });
    }
    
    res.status(401).json({ 
      success: false, 
      message: 'Invalid refresh token',
      code: 'REFRESH_TOKEN_INVALID'
    });
  }
};

// Device fingerprint validation middleware
const validateDevice = (req, res, next) => {
  const deviceFingerprint = req.header('X-Device-Fingerprint');
  const userAgent = req.get('User-Agent');
  const clientIP = req.ip;

  if (req.token && req.token.device) {
    // Check if device fingerprint matches
    if (deviceFingerprint && req.token.device.fingerprint !== deviceFingerprint) {
      return res.status(401).json({ 
        success: false, 
        message: 'Device mismatch detected',
        code: 'DEVICE_MISMATCH'
      });
    }

    // Check if IP address is significantly different (optional)
    if (clientIP && req.token.device.ip !== 'unknown' && req.token.device.ip !== clientIP) {
      console.warn(`⚠️ IP address change detected for user ${req.user._id}: ${req.token.device.ip} -> ${clientIP}`);
      // Don't block, just log for security monitoring
    }
  }

  next();
};

// Role-based access control middleware
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    next();
  };
};

// Admin-only middleware
const requireAdmin = requireRole(['admin', 'superadmin']);

// Super admin only middleware
const requireSuperAdmin = requireRole(['superadmin']);

module.exports = { 
  auth, 
  optionalAuth, 
  refreshAuth,
  validateDevice,
  requireRole,
  requireAdmin,
  requireSuperAdmin,
  generateSecureToken,
  generateRefreshToken
}; 